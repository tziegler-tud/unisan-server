import Component from "./Component";
import ComponentPage from "./ComponentPage"

export interface ComponentSectionOptions {
    identifier: string;
    order?: number;
    title?: string;
    displayMode?: "hidden"|"show"; /** display section title*/
    disableMargins?: boolean;
    disableComponentMargins?: boolean;
    styling?: {
        backgroundColor?: string,
    }
}


export default class ComponentSection {
    public identifier: string;
    public order: number;
    public title: string;
    private readonly displayMode: string;
    private readonly disableComponentMargins: boolean;
    private readonly disableMargins: boolean;
    private readonly styling?: {
        backgroundColor?: string,
    }
    public components: Component[];
    private container: HTMLElement;
    private componentPage: ComponentPage;
    componentContainer: HTMLElement;

    constructor(
                    componentPage: ComponentPage,
                    {
                        identifier,
                        order = 0,
                        title = undefined,
                        displayMode = "hidden",
                        disableComponentMargins = false,
                        disableMargins = false,
                        styling = {},
                    }: ComponentSectionOptions
    ) {
        this.identifier = identifier;
        this.order = order;
        this.title = title ?? identifier;
        this.displayMode = displayMode;
        this.disableComponentMargins = disableComponentMargins;
        this.disableMargins = disableMargins;
        this.styling = styling;
        this.components = [];
        this.container = this.buildHtml();
        this.componentPage = componentPage

    }

    addComponent(component: Component): void {
        this.components.push(component);
    }

    private buildHtml(): HTMLElement {
        let html = "";
        const container = document.createElement("div");
        container.classList.add("componentPage-section");

        if (this.disableComponentMargins) {
            container.classList.add("componentPage-section__disableComponentMargins");
        }
        if (this.disableMargins) {
            container.classList.add("componentPage-section__disableMargins");
        }

        container.id = `component-section__${this.identifier}`;
        container.style.order = String(this.order);

        const componentContainer = document.createElement("div");
        componentContainer.classList.add("component-section--components", "componentPage-component-container");

        switch (this.displayMode) {
            case "hidden":
                break;
            case "show": {
                const titleContainer = document.createElement("div");
                titleContainer.classList.add("component-section--title");
                const title = document.createElement("span");
                title.innerHTML = this.title;
                titleContainer.appendChild(title);
                container.appendChild(titleContainer);
                break;
            }
            default:
                break;
        }

        if(this.styling) {
            if(this.styling.backgroundColor) {
                componentContainer.style.backgroundColor = this.styling.backgroundColor;
            }
        }

        container.appendChild(componentContainer);
        this.container = container;
        this.componentContainer = componentContainer;
        return container;
    }

    render(): void {
        this.componentPage.renderSectionHtml(this.container);
    }

    async reload(){
        this.components.forEach(async component => {
            await component.reload();
        })
    }
}