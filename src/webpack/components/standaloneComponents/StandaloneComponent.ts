import Handlebars from "handlebars";
import "./standaloneComponent.scss";
import ComponentObserver from "../ComponentObserver";
import {InteractionConfig} from "./InteractiveList/Interaction";
import {ListEntry} from "./InteractiveList/InteractiveListStandalone";

export interface ComponentConfig {
    container: {
        classes: string[] | string;
    };
    [key: string]: any;
}

export interface RenderOptions {
    pre?: boolean;
    post?: boolean;
}

export interface StandaloneComponentParams {
    name: string;
    element: HTMLElement;
    config?: Partial<ComponentConfig>;
    entries: ListEntry[],
    interactions: InteractionConfig[],
}

export default class StandaloneComponent {
    componentName: string;
    container: HTMLElement;
    templateUrl: string;
    data: {
        entries: ListEntry[],
        interactions: InteractionConfig[],
    }
    id: string;
    config: ComponentConfig;
    observers: ComponentObserver[];

    constructor({ name, element, config = {}, entries = [], interactions = [] }: StandaloneComponentParams) {
        this.componentName = name;
        this.container = element;
        this.templateUrl = "../templates/standalone/default.hbs";
        this.data = {

        }
        this.id = `${name}`;

        const defaultClassName = `${name}-component-container`;
        const defaultConfig: ComponentConfig = {
            container: {
                classes: [defaultClassName],
            },
        };

        // Merge defaultConfig with user config
        this.config = Object.assign({}, defaultConfig, config);
        this.observers = [];
    }

    getTemplateData(): Record<string, unknown> {
        return {
            id: this.id,
            componentName: this.componentName,
            config: this.config,
            data: this.data,
        };
    }

    setData(data: Record<string, unknown>): void {
        this.data = data;
    }

    async render({ pre = true, post = true }: RenderOptions = {}): Promise<void> {
        if (pre) await this.preRender();

        // Load template
        const templateData = await $.get(this.templateUrl);
        const template = Handlebars.compile(templateData);
        const html = template(this.getTemplateData());

        // Inject into DOM
        this.container.innerHTML = html;

        // Add CSS classes
        const containerClasses = this.config.container.classes;
        if (Array.isArray(containerClasses)) {
            containerClasses.forEach((cls) => this.container.classList.add(cls));
        } else {
            this.container.classList.add(containerClasses);
        }

        if (post) await this.postRender();
        return;
    }

    // Lifecycle hooks — meant to be overridden by subclasses
    async preRender(): Promise<void> {
        // no-op
    }

    async postRender(): Promise<void> {
        // no-op
    }

    addObserver(observer: ComponentObserver): void {
        this.observers.push(observer);
    }

    emitEvent({ event, data }: { event: string; data: unknown }): void {
        this.observers.forEach((observer) => observer.inform({ event, data }));
    }
}
