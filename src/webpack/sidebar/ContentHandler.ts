import Sidebar, {HandlerFunctionResult} from "./Sidebar";

interface ContentHandlerArgs {
    callback?: {
        onSave?: () => any;
        onLoad?: (handlerContent: any[]) => any;
    };
    validators?: {
        function: () => { state: boolean; reason: string } | boolean;
        callback: {
            onSuccess: () => void;
            onFailure: (reason: string) => void;
        };
    }[];
}

export default class ContentHandler {
    type: string;
    fn: (sidebar: Sidebar, args: any, type: string, handler: ContentHandler) => Promise<HandlerFunctionResult>;
    inputs: any[] = [];
    validators: {
        function: () => { state: boolean; reason: string } | boolean;
        callback: {
            onSuccess: () => void;
            onFailure: (reason: string) => void;
        };
    }[] = [];
    args: ContentHandlerArgs;

    constructor(
        type: string,
        handlerFunction: (sidebar: Sidebar, args: any, type: string, handler: ContentHandler) => Promise<HandlerFunctionResult>,
        handlerArgs: ContentHandlerArgs = {}
    ) {
        this.type = type;
        this.fn = handlerFunction;
        this.args = {
            callback: {
                onSave: () => this.defaultOnSave(),
                onLoad: (handlerContent) => this.defaultOnLoad(handlerContent),
            },
            validators: [],
            ...handlerArgs,
        };
    }

    private defaultOnSave(): any[] {
        const handlerContent: { id: string; value: any; type: string }[] = [];
        const inputs = document.querySelectorAll(".sidebar input");
        inputs.forEach((el) => {
            const type = (el as HTMLInputElement).type;
            let value: any;
            switch (type) {
                case "checkbox":
                    value = (el as HTMLInputElement).checked;
                    break;
                case "date":
                    value = (el as HTMLInputElement).value;
                    break;
                default:
                    value = (el as HTMLInputElement).value;
                    break;
            }
            handlerContent.push({
                id: el.id,
                value,
                type,
            });
        });
        return handlerContent;
    }

    private defaultOnLoad(handlerContent: any[]): void {
        handlerContent.forEach((entry) => {
            const el = document.getElementById(entry.id) as HTMLInputElement;
            if (el) {
                switch (entry.type) {
                    case "checkbox":
                        el.checked = entry.value;
                        break;
                    case "date":
                        el.value = entry.value;
                        break;
                    default:
                        el.value = entry.value;
                        break;
                }
            }
        });
    }

    apply(sidebar: Sidebar, args: any, type: string): Promise<HandlerFunctionResult> {
        return this.fn(sidebar, args, type, this);
    }

    save(): any {
        return this.args.callback.onSave() || this.defaultOnSave();
    }

    load(handlerContent: any[]): void {
        this.args.callback.onLoad(handlerContent) || this.defaultOnLoad(handlerContent);
    }

    removeCustomValidators(): void {
        this.validators = [];
    }

    addCustomValidator(
        func: () => { state: boolean; reason: string } | boolean,
        callback: { onSuccess: () => void; onFailure: (reason: string) => void }
    ): void {
        this.validators.push({ function: func, callback: callback });
    }

    validate(): boolean {
        let valid = true;
        this.validators.forEach((validator) => {
            try {
                let result = validator.function();
                if (typeof result === "boolean") result = { state: result, reason: "failed" };
                if (result.state) {
                    validator.callback.onSuccess();
                } else {
                    validator.callback.onFailure(result.reason);
                    valid = false;
                }
            } catch (e) {
                console.error("callback error: " + e);
                valid = false;
            }
        });
        return valid;
    }
}