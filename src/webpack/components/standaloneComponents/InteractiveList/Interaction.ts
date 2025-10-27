import StandaloneComponent from "../StandaloneComponent";
import {nanoid} from "nanoid";
import Handlebars from "handlebars";
import {MDCList} from "@material/list";
import ComponentObserver from "../../ComponentObserver";
import {ListEntry} from "./InteractiveListStandalone";

export interface InteractionOptions {
    label: string,
    value: string | number | boolean,
    description?: string,
    disabled: boolean,
}

export interface InteractionAdditionalConfig {
    enableDescription?: boolean,
    classes?: string[],
}

export interface InteractionParams {
    disabled?: boolean,
    readonly?: boolean,
    required?: boolean,
}

export interface InteractionConfig {
    type: "label" | "switch" | "input" | "select";
    uid: string;
    identifier: string;
    valueFunc: (entry: ListEntry) => string | number | boolean;
    params?: InteractionParams
    interactive?: boolean;
    disabled?: boolean;
    defaultIcon?: string;
    options?: InteractionOptions[],
    additionalConfig: InteractionAdditionalConfig,
}

export interface InteractionConstructorData extends InteractionConfig {
    value: string | number | boolean;
    entry: ListEntry;
}

export default class Interaction {
    id: string;
    type: string;
    identifier: string;
    params: InteractionParams
    additionalConfig: InteractionAdditionalConfig;
    options: InteractionOptions[];
    value: unknown;
    entry: ListEntry;
    html: string;
    element?: HTMLElement;
    observers: ComponentObserver[];
    private getValFunc: () => any;
    private setValFunc: (val: any) => any;

    constructor({
                    type,
                    uid,
                    identifier,
                    params = {},
                    additionalConfig = {},
                    value,
                    entry,
                    options = [],
                }: InteractionConstructorData)
    {
        this.id = uid;
        this.type = type;
        this.identifier = identifier;
        this.params = params;
        this.additionalConfig = additionalConfig;
        this.options = options;
        this.value = value;
        this.entry = entry;
        this.getValFunc = () => undefined;
        this.setValFunc = () => undefined;
        this.observers = [];
    }

    async build() {
        let templateUrl = "/webpack/components/templates/switchInteraction.hbs";
        switch (this.type) {
            case "input":
                templateUrl = "/webpack/components/templates/inputInteraction.hbs";
                break;
            case "label":
                templateUrl = "/webpack/components/templates/labelInteraction.hbs";
                break;
            case "select":
                templateUrl = "/webpack/components/templates/selectInteraction.hbs";
                break;
        }
        const templateData = await $.get(templateUrl);
        const template = Handlebars.compile(templateData);
        this.html = template(this);
        return;
    }


    connectDom(): boolean {
        const element = document.getElementById(this.id);
        if (!element) {
            console.error("Failed to obtain DOM element for interaction: Element not found.");
            return false;
        }
        this.element = element;
        this.applyConfig();
        return true;
    }

    applyConfig(): void {
        if (!this.element) return;
        const { classes } = this.additionalConfig as { classes?: string | string[] };
        if (classes) {
            if (Array.isArray(classes)) {
                classes.forEach((cls) => this.element!.classList.add(cls));
            } else {
                this.element.classList.add(classes);
            }
        }
    }

    init(): void {
        switch (this.type) {
            case "switch": {
                const mdcSwitch = document.getElementById(`${this.id}__switch`);
                if (!mdcSwitch) return;
                const switchControl = new MDCSwitch(mdcSwitch);
                this.getValFunc = () => switchControl.selected;
                this.setValFunc = (value: boolean) => (switchControl.selected = value);
                mdcSwitch.addEventListener("click", () => this.hasChanged());
                if (this.value) this.setValue(this.value);
                break;
            }

            case "input": {
                const input = document.getElementById(`${this.id}__input`) as HTMLInputElement | null;
                if (!input) return;
                this.getValFunc = () => input.value;
                this.setValFunc = (value: string) => (input.value = value);
                input.addEventListener("change", () => this.hasChanged());
                this.element?.addEventListener("click", () => this.isClicked());
                if (this.value) this.setValue(this.value);
                break;
            }

            case "label": {
                const label = document.getElementById(`${this.id}__label`);
                if (!label) return;
                this.getValFunc = () => (label as HTMLElement).dataset.value;
                this.setValFunc = (value: string) => {
                    (label as HTMLElement).innerHTML = value;
                    (label as HTMLElement).dataset.value = value;
                    return value;
                };
                this.element?.addEventListener("click", () => this.isClicked());
                if (this.value) this.setValue(this.value);
                break;
            }

            case "select": {
                const select = document.getElementById(`${this.id}__select`) as HTMLSelectElement | null;
                if (!select) return;
                this.getValFunc = () => select.value;
                this.setValFunc = (value: string) => (select.value = value);
                select.addEventListener("change", () => this.hasChanged());
                this.element?.addEventListener("click", () => this.isClicked());
                if (this.value) this.setValue(this.value);
                break;
            }
        }
    }

    setValue(value: any): void {
        this.value = this.setValFunc(value);
    }

    getValue(): any {
        return this.getValFunc();
    }

    private notify(event: string): void {
        const data = { value: this.getValue(), interaction: this, entry: this.entry };
        this.observers.forEach((observer: any) => observer.inform({ event, data }));
    }

    hasChanged(): void {
        this.notify("changed");
    }

    isClicked(): void {
        this.notify("click");
    }

    addObserver(observer: any): void {
        this.observers.push(observer);
    }
}
