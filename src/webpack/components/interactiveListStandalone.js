import StandaloneComponent from "./StandaloneComponent.js"
import ComponentObserver from "./ComponentObserver.js";
import "./scss/interactiveList.scss";
import Handlebars from "handlebars";
import {MDCSwitch} from '@material/switch';
import {MDCList} from "@material/list";
import {nanoid} from "nanoid";

/**
 * @typedef ListEntry
 * @property {string} label - list entry label as displayed
 * @property {string|Integer|Boolean} value  - corresponding value. String or Int for Labels, inputs and selects , Boolean for switch
 * @property {string=} identifier - should be unique, can be used to identify the entry
 * @property [string=] icon - material ui icon font code. If unset, the default icon will be used
 * @property {Boolean=true} interactive - if false, disables hover animations. Default true.
 * @property {Boolean=true} disabled - if true, displays the list as disabled. Default false.
 */

/**
 * @typedef InteractionConfig
 * @property {string} type - one of "label", "switch", "input", "select"
 * @property {string} identifier - Must be unique. Used internally, is added to the interaction dom element as data-identifier
 * @property {Function} valueFunc - function to be parsed to obtain the value. Receives a ListEntry as single argument
 * @property {Object} params - passed as variable "params" to handlebars
 * @property {Boolean=true} interactive - if false, disables hover animations. Default true.
 * @property {Boolean=true} disabled - if true, displays the list as disabled. Default false.
 * @property {string=} defaultIcon - default icon to be shown before list entries
 * @property {Object=} config
 * @property {string | string[]=} config.classes - css class names to be added to the interaction
 *
 */

export default class InteractiveListStandaloneComponent extends StandaloneComponent{
    /**
     *
     * @param element {Element} container element
     * @param config {Object}
     * @param data {Object}
     * @param data.listEntries {ListEntry[]} Array of list entries. Each entry requires a "label" and "value" property
     * @param data.interactions {InteractionConfig[]} Array of Interaction configurations
     * @param config.order {Integer=} order inside componentContainer
     * @param config.entryLabel {Function=} function to obtain label for entries. Receives entry as argument
     * @returns {InteractiveListComponent}
     * @constructor
     */
    constructor({element, config={}, data={listEntries: [], interactions: []}}={}) {
        super({name: "interactiveList", element: element, config: config, data: data});

        /**
         * @type {Interaction[]}
         */
        this.interactions = [];

        /**
         * @type {Entry[]}
         */
        this.entries = [];

        /**
         *
         * @param {Entry} entry
         * @returns {string}
         */
        let defaultLabelFunc = function(entry){
            return entry.toString();
        }
        this.config.entryLabel = this.config.entryLabel ? this.config.entryLabel : defaultLabelFunc;
        this.interactionData = data.interactions;

        this.identifierCounter = 0;
        this.templateUrl = "/webpack/components/templates/standalone/interactiveList.hbs";
        this.uid = nanoid();
        this.container.dataset.uid = this.uid;

        this.config.defaultIcon = this.config.defaultIcon ?? "task_alt"
        this.config.disabled = this.config.disabled ?? false;
        this.config.interactive = this.config.interactive ?? true;
    }

    preRender(){
        let self = this;
        return new Promise(function(resolve, reject){
            //build interaction objects
            let outerPromises = [];
            self.entries = [];
            self.interactions = [];
            let index = 0;
            self.data.listEntries.forEach(listEntry => {
                index++;
                let entry = new Entry({
                    label: self.config.entryLabel(listEntry),
                    listEntry: listEntry,
                    icon: listEntry.icon ?? self.config.defaultIcon,
                    order: index,
                    interactive: listEntry.interactive ?? self.config.interactive,
                    disabled: listEntry.disabled ?? self.config.disabled,
                })
                self.entries.push(entry);
                outerPromises.push(new Promise(function(resolve, reject){
                    let promises = [];
                    self.interactionData.forEach(interactionData => {
                        interactionData.value = interactionData.valueFunc(listEntry);
                        interactionData.entry = listEntry;
                        promises.push(self.buildInteraction(interactionData))
                    })
                    Promise.all(promises)
                        .then(interactions => {
                            interactions.forEach(interaction=>{
                                self.interactions.push(interaction);
                            })
                            //add interactions to list entry
                            entry.setInteractions(interactions);
                            resolve();
                        })
                }))
            })
            Promise.all(outerPromises)
                .then(result => {
                    //sort entries by order
                    self.entries.sort((a,b)=> {
                        return (a.order - b.order);
                    })
                    self.data.entries = self.entries;
                    resolve();
                })
        })

    }

    buildInteraction({type, identifier, value, entry, options, params, config}){
        let self = this;
        let interaction;
        let templateUrl = "/webpack/components/templates/switchInteraction.hbs";
        switch(type){
            case "switch":
                templateUrl = "/webpack/components/templates/switchInteraction.hbs";
                break;
            case "input":
                templateUrl = "/webpack/components/templates/inputInteraction.hbs";
                break;
            case "label":
                templateUrl = "/webpack/components/templates/labelInteraction.hbs";
                break;
            case "select":
                templateUrl = "/webpack/components/templates/selectInteraction.hbs";

        }
        const uid = this.getNewIdentifier(type);
        return new Promise(function(resolve, reject){
            $.get(templateUrl, function (templateData) {
                let template = Handlebars.compile(templateData);
                let interaction = new Interaction({type, uid, identifier, template, templateData: {params: params}, value, entry, options, config});
                resolve(interaction);
            })
        })
    }

    getNewIdentifier(prefix){
        let prefixText = prefix ? prefix + "-" : "";
        return this.uid + "__" + prefixText + this.identifierCounter++;
    }

    postRender(){
        let self = this;
        const list = new MDCList(document.querySelector('.mdc-deprecated-list'));


        this.interactions.forEach(interaction=>{
            //hookup interactions with their dom elements
            const dom = interaction.connectDom();
            if(dom){
                interaction.init();
                let o = new ComponentObserver(function(event, data){
                    self.emitEvent({event: event, data: data});
                });
                interaction.addObserver(o)

            }
        })
    }

    getEntries(){
        return this.entries;
    }

    setListEntries(listEntries){
        this.data.listEntries = listEntries;
    }
    getListEntries(){
        return this.data.listEntries;
    }
}

class Interaction {
    constructor({type, uid, identifier, template, templateData={}, value, entry, options=[], config={}}={}){
        this.id = uid;
        this.type = type;
        this.identifier = identifier;
        this.config = config
        this.options = options;
        this.value = value;
        this.entry = entry;
        templateData.id = this.id;
        templateData.identifier = this.identifier;
        templateData.type = this.type;
        templateData.options = this.options;
        templateData.config = this.config;
        this.html = template(templateData);
        this.element = undefined;
        this.getValFunc = function(){return undefined;}
        this.setValFunc = function(){return undefined;}
        this.observers = [];
    }

    connectDom(){
        //find uid
        let element = document.getElementById(this.id);
        if(!element){
            console.error("Failed to obtain DOM element for interaction: Element not found.");
            return false;
        }
        this.element = element;
        this.applyConfig();
        return true;
    }

    applyConfig(){
        if(this.config.classes){
            if(Array.isArray(this.config.classes)){
                this.config.classes.forEach(classEntry => {
                    this.element.classList.add(classEntry)
                })
            }
            else {
                this.element.classList.add(this.config.classes)
            }
        }
    }

    init(){
        let self = this;
        switch(this.type){
            case "switch":
                //get mdc container
                let mdcSwitch = document.getElementById(this.id + "__switch");
                const switchControl = new MDCSwitch(mdcSwitch);
                this.getValFunc = function(){
                    return switchControl.selected;
                }
                this.setValFunc = function(value){
                    switchControl.selected = value;
                    return value;
                }
                mdcSwitch.addEventListener("click", function(){
                    self.hasChanged();
                })

                //set value if one was given
                if(this.value) {
                    this.setValue(this.value)
                }
                break;
            case "input":
                let input = document.getElementById(this.id + "__input");
                this.getValFunc = function(){
                    return input.value;
                }
                this.setValFunc = function(value){
                    input.value = value;
                    return value;
                }
                input.addEventListener("change", function(){
                    self.hasChanged();
                })
                self.element.addEventListener("click", function(){
                    self.isClicked();
                })
                //set value if one was given
                if(this.value) {
                    this.setValue(this.value)
                }
                break;
            case "label":
                let label = document.getElementById(this.id + "__label");
                this.getValFunc = function(){
                    return label.dataset.value;
                }
                this.setValFunc = function(value){
                    label.innerHTML = value
                    label.dataset.value = value;
                    return value;
                }
                self.element.addEventListener("click", function(){
                    self.isClicked();
                })
                //set value if one was given
                if(this.value) {
                    this.setValue(this.value)
                }
                break;

            case "select":
                let select = document.getElementById(this.id + "__select");
                let description = document.getElementById(this.id + "__description")
                this.getValFunc = function(){
                    return select.value;
                }
                this.setValFunc = function(value){
                    select.value = value;
                    return value;
                }
                select.addEventListener("change", () => {
                    this.hasChanged();
                })
                this.element.addEventListener("click", () => {
                    this.isClicked();
                })
                //set value if one was given
                if(this.value) {
                    this.setValue(this.value)
                }

                function findSelectedOption(options, value){
                    return options.find(option => option.value === value);
                }
        }

    }

    setValue(value){
        this.value = this.setValFunc(value);
    }

    getValue(){
        return this.getValFunc();
    }

    hasChanged(){
        const data = {
            value: this.getValue(),
            interaction: this,
            entry: this.entry,
        }
        //notify observers
        this.observers.forEach(observer => {
            observer.inform({event: "changed", data: data});
        })
    }

    isClicked(){
        const data = {
            value: this.getValue(),
            interaction: this,
            entry: this.entry,
        }
        //notify observers
        this.observers.forEach(observer => {
            observer.inform({event: "click", data: data});
        })
    }

    addObserver(observer){
        this.observers.push(observer);
    }
}

class Entry {
    /**
     *
     * @param {String} label
     * @param {Object} listEntry
     * @param {String} icon
     * @param {Integer} order
     * @param {Boolean} interactive
     * @param {Boolean} disabled
     */
    constructor({label, listEntry, icon, order, interactive, disabled}) {
        this.label = label
        this.listEntry = listEntry;
        this.icon = icon;
        this.order = order;
        this.interactive = interactive;
        this.disabled = disabled;
    }

    /**
     *
     * @param {Interaction[]} interactions
     */
    setInteractions(interactions){
        this.interactions = interactions;
    }
}