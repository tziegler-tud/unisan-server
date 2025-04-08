// @ts-ignore
import Handlebars from "handlebars";
import ComponentPage from "./ComponentPage";
import ComponentSection from "./ComponentSection";

export interface ComponentOptions {
    page: ComponentPage;
    section: any;
    componentId?: string;
    pageData?: any;
    data?: any;
    args?: ComponentOptionArgs
}

export interface ComponentOptionArgs {
    order?: number;
    allowEdit?: boolean;
    allowEditCritical?: boolean;
    acl?: any;
    size?: "full" | "half";
    classes?: string;
    handlers?: any[];
}

interface Observer {
    inform(event: { event: string; data: any }): void;
}

export default class Component {
    protected data: any;
    protected pageData: any;
    protected page: ComponentPage;
    protected section: ComponentSection;
    protected user: any;
    protected args: ComponentOptionArgs;
    protected container: HTMLElement;
    protected html: string;
    protected templateUrl: string;
    protected handleData: {
        data: any;
        args: {
            allowEdit: boolean;
            acl: any;
        };
    };
    protected errorMessage: string;
    protected observers: Observer[];
    protected componentId: string;

    /**
     * Component constructor
     * @param options {ComponentOptions} The options object
     */
    constructor(options: ComponentOptions) {
        const defaults: ComponentOptionArgs = {
            allowEdit: true,
            allowEditCritical: false,
            acl: undefined,
            size: "full",
            classes: "",
            order: Date.now(),
            handlers: [],
        };

        const args = options.args ? options.args : {};
        this.args = { ...defaults, ...args };
        this.page = options.page;
        this.section = options.section;
        this.data = options.data || {};
        this.pageData = options.pageData || {};
        this.user = this.data.user;
        this.componentId = options.componentId || Date.now().toString();

        this.container = document.createElement("div");
        this.container.classList.add("componentPage-component-wrapper");

        switch (this.args.size) {
            case "full":
                this.container.classList.add("componentPage-component-wrapper--full");
                break;
            case "half":
                this.container.classList.add("componentPage-component-wrapper--half");
                break;
        }

        this.container.style.order = String(this.args.order);
        // this.html = this.container;

        this.templateUrl = "";
        this.handleData = {
            data: this.data,
            args: {
                allowEdit: this.args.allowEdit,
                acl: this.args.acl,
            },
        };

        this.errorMessage = `Component ${this.componentId} failed to render:`;
        this.observers = [];
    }

    async renderComponent({ pre = true, post = true } = {}): Promise<{
        html: string | undefined;
        error: any;
        component: Component;
    }> {
        const result = {
            html: undefined,
            error: undefined,
            component: this,
        };

        try {
            if (pre) await this.preRender();

            const templateData = await $.get(this.templateUrl);
            const template = Handlebars.compile(templateData);
            this.container.innerHTML = template(this.handleData);
            const pageRenderResult = this.page.renderComponentHtml(this.section, this.container);

            if (pageRenderResult.error) {
                this.fail(pageRenderResult.error);
            } else {
                this.postRenderInternal();
                if (post) {
                    await this.postRender();
                }
            }

            return result;
        } catch (err) {
            this.fail(err);
            result.error = err;
            return result;
        }
    }

    async preRender(): Promise<void> {}

    async postRender(): Promise<void> {}

    protected postRenderInternal(): void {
        this.container.style.order = String(this.args.order);
    }

    protected fail(error: any): void {
        console.error(`${this.errorMessage} ${error}`);
    }

    getHtml(): string {
        return this.html;
    }

    addObserver(observer: Observer): void {
        this.observers.push(observer);
    }

    emitEvent({ event, data }: { event: string; data: any }): void {
        this.observers.forEach((observer) => {
            observer.inform({ event, data });
        });
    }
}