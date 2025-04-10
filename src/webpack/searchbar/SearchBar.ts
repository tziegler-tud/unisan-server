import "./searchbar.scss";
import { MDCTextField } from "@material/textfield";
import { MDCRipple } from "@material/ripple";
import { MDCTextFieldIcon } from "@material/textfield/icon";

export interface SearchbarArgs {
    hidden?: boolean;
    label?: string;
    noIcon?: boolean;
    enableCollapse?: boolean;
    classes?: string;
    onInput?: {
        enabled?: boolean;
        callback?: (value: string) => void;
    };
    onFocus?: {
        enabled?: boolean;
        callback?: (value: string) => void;
    };
}

interface SearchbarDomElements {
    container: HTMLDivElement;
    icon: HTMLDivElement;
    input: HTMLLabelElement;
}

export default class Searchbar {
    private static counter = 0;
    public id: string;
    public searchbarArgs: SearchbarArgs;
    public domElements: SearchbarDomElements;
    public isActive: boolean;
    public container: HTMLElement;
    public input: HTMLLabelElement | undefined;
    public init: Promise<void>;

    constructor(container: HTMLElement, searchbarArgs: SearchbarArgs = {}) {
        this.id = `searchbar${++Searchbar.counter}`;
        this.searchbarArgs = {
            hidden: true,
            label: "Suche:",
            noIcon: false,
            enableCollapse: true,
            onInput: { enabled: false, callback: () => {} },
            onFocus: { enabled: false, callback: () => {} },
            ...searchbarArgs,
        };
        this.domElements = {} as SearchbarDomElements;
        this.isActive = true;
        this.container = container;
        this.input = undefined;

        this.init = new Promise<void>((resolve, reject) => {
            if (!container) {
                reject("Searchbar failed to initialize: cannot instantiate search bar without container!");
                return;
            }
            const searchbarHTML = this.buildHTML();
            this.setupEventHandlers(searchbarHTML);
            container.append(searchbarHTML);
            resolve();
        });

        this.init
            .then(() => {
                if (this.searchbarArgs.hidden) this.hide();
            })
            .catch((msg) => {
                console.warn(msg);
            });
    }

    private buildHTML(): HTMLDivElement {
        this.container.classList.add("searchbar-container");
        const sb = document.createElement("div");
        sb.className = "searchbar";
        sb.id = this.id;

        const icon = this.createIconButton();
        if (!this.searchbarArgs.noIcon) {
            this.container.append(icon);
        }

        const input = this.createInput();
        input.id = `searchbarInput${Searchbar.counter}`;
        this.input = input;
        sb.append(input);

        this.domElements.container = sb;
        this.domElements.icon = icon;
        this.domElements.input = input;

        return sb;
    }

    private createIconButton(): HTMLDivElement {
        const icon = document.createElement("div");
        icon.id = `searchbar-icon${Searchbar.counter}`;
        icon.className = "mdc-touch-target-wrapper";
        const button = document.createElement("button");
        button.className = "mdc-icon-button mdc-icon-button--touch material-icons";
        const ripple = document.createElement("div");
        ripple.className = "mdc-icon-button__ripple";
        const touch = document.createElement("div");
        touch.className = "mdc-icon-button__touch";

        button.innerHTML = "search";
        button.prepend(ripple);
        button.append(touch);
        icon.append(button);

        const iconRipple = new MDCRipple(ripple);
        iconRipple.unbounded = true;

        return icon;
    }

    private createInput(): HTMLLabelElement {
        const input = document.createElement("label");
        input.className = "mdc-text-field mdc-text-field--filled mdc-text-field--with-trailing-icon";
        const ripple = document.createElement("span");
        ripple.className = "mdc-text-field__ripple";
        const label = document.createElement("span");
        label.className = "mdc-floating-label";
        label.id = `searchbarLabel${Searchbar.counter}`;
        const inputElement = document.createElement("input");
        inputElement.className = "mdc-text-field__input";
        inputElement.type = "text";
        inputElement.setAttribute("aria-labelledby", label.id);
        const trailingIcon = document.createElement("i");
        trailingIcon.className = "material-icons mdc-text-field__icon mdc-text-field__icon--trailing";
        trailingIcon.setAttribute("tabindex", "0");
        trailingIcon.role = "button";
        trailingIcon.innerHTML = "clear";
        const line = document.createElement("span");
        line.className = "mdc-line-ripple";

        label.innerHTML = this.searchbarArgs.label || "Suche:";

        input.append(ripple);
        input.append(label);
        input.append(inputElement);
        input.append(trailingIcon);
        input.append(line);

        new MDCTextField(input);
        new MDCTextFieldIcon(trailingIcon);

        trailingIcon.addEventListener("click", () => this.resetInput());

        return input;
    }

    private setupEventHandlers(searchbarHTML: HTMLDivElement): void {
        const inputElement = this.domElements.input.querySelector("input") as HTMLInputElement;

        if (this.searchbarArgs.onInput?.enabled) {
            inputElement.addEventListener("input", () => this.searchbarArgs.onInput?.callback?.(inputElement.value));
        }
        if (this.searchbarArgs.onFocus?.enabled) {
            inputElement.addEventListener("focus", () => this.searchbarArgs.onFocus?.callback?.(inputElement.value));
        }

        if (this.searchbarArgs.enableCollapse) {
            this.domElements.icon.addEventListener("click", () => this.toggle());
        }
    }

    public getInputElement(): HTMLLabelElement | null {
        return this.input || null;
    }

    public getValue(): string | null {
        return (this.domElements.input.querySelector("input") as HTMLInputElement)?.value || null;
    }

    public resetInput(): void {
        const inputElement = this.domElements.input.querySelector("input") as HTMLInputElement;
        if (inputElement) {
            inputElement.value = "";
            if (this.searchbarArgs.onInput?.enabled) {
                this.searchbarArgs.onInput.callback?.(inputElement.value);
            }
        }
    }

    public hide(): void {
        this.container.classList.add("hidden");
        this.isActive = false;
    }

    public show(): void {
        this.container.classList.remove("hidden");
        this.isActive = true;
    }

    public toggle(): void {
        this.isActive ? this.hide() : this.show();
    }
}