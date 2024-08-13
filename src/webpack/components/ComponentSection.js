export default class ComponentSection{
    /**
     * @param componentPage {ComponentPage}
     * @param identifier {String}
     * @param order {Number}
     * @param title {String}
     * @param displayMode {String}
     * @param disableComponentMargins {Boolean}
     */
    constructor({componentPage, identifier, order=0, title=undefined, displayMode="hidden", disableComponentMargins=false}){
        this.identifier = identifier;
        this.order = order;
        this.title = title ?? identifier;
        this.displayMode = displayMode;
        this.disableComponentMargins = disableComponentMargins;

        /**
         *
         * @type {Component[]}
         */
        this.components = [];
        this.container = this.buildHtml();
        this.componentPage = componentPage

    }

    /**
     *
     * @param component {Component}
     */
    addComponent(component){
        this.components.push(component)
    }

    buildHtml(){
        let html = "";
        let container = document.createElement("div");
        container.classList.add("componentPage-section");
        container.id = `component-section__${this.identifier}`
        container.style = `order: ${this.order}`;

        let componentContainer = document.createElement("div");
        componentContainer.classList.add("component-section--components",  "componentPage-component-container");

        switch(this.displayMode){
            default:
            case "hidden":
                break;
            case "show":
                let titleContainer = document.createElement("div");
                titleContainer.classList.add("component-section--title");
                let title = document.createElement("span");
                title.innerHTML = this.title;
                titleContainer.append(title)
                container.append(titleContainer);
                break;
        }

        container.append(componentContainer);

        this.container = container;
        this.componentContainer = componentContainer;
        return container;
    }

    render(){
        this.componentPage.renderSectionHtml(this.buildHtml());
    }

}