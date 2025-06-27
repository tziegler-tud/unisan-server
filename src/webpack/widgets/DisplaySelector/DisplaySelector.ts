import {MDCRipple} from '@material/ripple';

import "./DisplaySelector.scss"

interface ElementOptions {
    uid: string|number,
    value: string,
    active?: boolean,
    icon: string,
}

export interface DisplaySelectorEventData {
    uid: string|number,
    value: string,
}

export default class DisplaySelector {

    private readonly parent: HTMLElement;
    private elements: DisplaySelectorElement[];
    private elementOptions: ElementOptions[];
    private observers: Observer[];

    private activeElementUid: string|number;
    constructor(
        parent: HTMLElement,
        elementOptions: ElementOptions[],
        ) {
        this.parent = parent;
        this.elementOptions = elementOptions;
        this.elements = [];
        this.observers = [];

        if(!this.parent) throw new Error("DisplaySelector failed to initialize: cannot instantiate display selector without parent!");

        this._buildHTML()
    }

    _buildHTML(){

        const container = document.createElement("div");
        container.classList.add("displaySelector-container");

        this.elementOptions.forEach(elementOptions => {
            const element: DisplaySelectorElement = this._createButton(elementOptions)
            this.elements.push(element);
            container.appendChild(element.getHTML());

            if(elementOptions.active) element.setActive();

            element.onClick(()=>{
                if(this.activeElementUid !== element.uid) {
                    this._activateElement(element.uid);
                }
            })
        })

        this.parent.appendChild(container);
    }

    _createButton(elementOptions: ElementOptions): DisplaySelectorElement {
        return new DisplaySelectorElement(elementOptions);
    }

    _activateElement(uid: string|number, silent: boolean = false){
        this.elements.forEach(element => {
            if(element.uid === uid) element.setActive();
            else element.setInactive();
        })
        this.activeElementUid = uid;

        if(!silent) this.emitEvent(
            "displaySelectorElementChanged",
            {
                uid: uid,
                value: this.elements.find(element => element.uid === uid)?.value
            }
        )
    }

    setActiveElement(uid: string|number){
        this._activateElement(uid);
    }

    getActiveElement(): string|number {
        return this.activeElementUid;
    }

    listen(eventName: string, callback: (eventData: DisplaySelectorEventData) => void){
        this.observers.push(new Observer(eventName, callback));
    }

    emitEvent(eventName: string, eventData: DisplaySelectorEventData){
        this.observers.forEach(observer => {
            if(observer.eventName === eventName) observer.notify(eventData);
        })
    }
}

class DisplaySelectorElement {
    private container: HTMLElement;
    uid: string|number;
    value: string;
    isActive: boolean;
    private inputElement: HTMLInputElement;

    constructor(element: ElementOptions) {
        this.uid = element.uid;
        this.value = element.value
        this.container = this._buildHTML(element);
    }

    setActive(){
        this.container.classList.add("displaySelectorElement--active");
        this.inputElement.checked = true;
        this.isActive = true;
    }

    setInactive(){
        this.container.classList.remove("displaySelectorElement--active");
        this.inputElement.checked = false;
        this.isActive = false;
    }

    toggle(){
        if(this.isActive) this.setInactive();
        else this.setActive();
    }

    _buildHTML(element: ElementOptions): HTMLElement {

        const container = document.createElement("div");
        container.classList.add("displaySelectorElement");
        const label = document.createElement("label");
        label.classList.add("displaySelectorElement__buttonLabel");
        const icon = this._getIcon(element.icon);

        label.appendChild(icon);

        const input = document.createElement("input");
        input.id = "displaySelectorElement__input__" + element.uid;
        input.classList.add("displaySelectorElement__input");
        input.type = "radio";
        input.name = "displaySelectorElement--" + element.uid;
        input.value = element.value;
        input.checked = element.active ? element.active : false;

        this.inputElement = input;

        container.appendChild(label);
        container.appendChild(input);

        return container;
    }

    _getIcon(icon: string): HTMLElement {
        const button = document.createElement("button");
        button.classList.add("mdc-icon-button", "material-icons");
        const ripple = document.createElement("div");
        ripple.classList.add("mdc-icon-button__ripple");

        switch(icon){
            case "list":
                button.innerHTML = "list";
                break;
            case "cards":
                button.innerHTML = "dashboard_2";
                break;
            case "calendar":
                button.innerHTML = "calendar_month";
                break;
            case "resources":
                button.innerHTML = "view_week";
                break;
        }

        const iconButtonRipple = new MDCRipple(button);
        iconButtonRipple.unbounded = true;
        return button;
    }

    getHTML(){
        return this.container;
    }

    onClick(callback: () => void){
        this.container.addEventListener("click", callback);
    }
}

class Observer {
    eventName: string
    callback: (eventData: any) => void;
    constructor(eventName: string, callback: (eventData: DisplaySelectorEventData) => void) {
        this.eventName = eventName;
        this.callback = callback;
    }
    notify(eventData: DisplaySelectorEventData){
        this.callback(eventData);
    }
}