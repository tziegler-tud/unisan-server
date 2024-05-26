import "./editableInputField.scss";
import "./editor.scss";
import Quill from "quill";
import '/lib/quill/quill.snow-custom.css';
import '/lib/quill/quill.bubble-custom.css';

export default class EditableInputField {

    static #cssClassName = "editableInputField";
    static #cssHiddenClassName = "input-hidden";
    static #cssActiveClassName = "input-active";
    static #cssAllowEditingClassName = "allow-editing";
    static #cssAdditionalClassNames = [];

    quill = undefined;
    domElements = {};

    counter = {
        current: 0,
        next: function(){
            this.current++;
            return this.current;
        }
    }

    /**
     * constructor for EditableInputField objects
     *
     * @param {HTMLElement}container - container dom element
     * @param {Object} deltaContent - delta object to set as content
     * @param {String} type - input type. ["text"]
     * @param {Object} callback - callbacks to be executed when dialog buttons are used. currently, only 'onConfirm' is supported
     * @param {Object} args - readOnly: [false] disable input., active: [false] initialize with active editor, disableButtons: [false] disables dialog buttons, limit: [0] maximum amount of characters. Value 0 disables character limit.
     * @returns {EditableInputField}
     * @constructor
     */
    constructor(container, deltaContent, type="text", callback, {active=false, disableButtons=false, readOnly=false, limit=0}) {
        if (container === undefined) throw new Error("cannot instantiate input field without container");
        callback === undefined ? this.callback = {onConfirm: function(){console.log("no callback given")}}: this.callback = callback;
        this.id = EditableInputField.counter.next();


        container.classList.add(EditableInputField.#cssClassName, EditableInputField.#cssHiddenClassName, ...EditableInputField.#cssAdditionalClassNames);

        if(!readOnly) {
            container.classList.add(EditableInputField.#cssAllowEditingClassName);
        }

        this.args = args;
        this.container = container;
        this.deltaContent = deltaContent;

        this.quillcontainer = document.createElement("div");
        this.quillcontainer.className = "text-editor"

        var toolbarOptions = [
            ['bold', 'italic', 'underline'/*, 'strike'*/],        // toggled buttons
            // ['blockquote', 'code-block'],
            // ['link', 'image'],

            // [{ 'header': 1 }, { 'header': 2 }],               // custom button values
            // [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
            // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
            // [{ 'direction': 'rtl' }],                         // text direction

            // [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
            // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
            // [{ 'font': [] }],
            // [{ 'align': [] }],

            ['clean']                                         // remove formatting button
        ];

        const quill = new Quill(this.quillcontainer, {
            // theme: 'snow',
            theme: 'bubble',
            modules: {
                toolbar: toolbarOptions,
                clipboard: {
                    newLines: false
                },
                keyboard: {
                    bindings: {
                        enter: {
                            key: 13,
                            handler: function () {
                                return false;
                            }
                        }
                    }
                },
            },
            bounds: quillcontainer,

        });
        quill.setContents(this.deltaContent);

        this.quill = quill;

        //deactivate on default
        if (args.active === true){
            this.activate();
        }
        else {
            this.deactivate();
        }
    }

    buildHTML(){
        let id = this.id;
        let buttonContainer = document.createElement("div");
        buttonContainer.className = "editableInputField-dialog-container";
        buttonContainer.id= "editableInputField-dialog-container"+id;
        if (this.disableButtons === true) buttonContainer.style.display = "none";

        //add confirm button
        let confirmButton = document.createElement("div");
        confirmButton.className = "editableInputField-dialog-button editableInputField-dialog-confirmButton";
        confirmButton.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-check\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg>"

        //add cancel button
        let cancelButton = document.createElement("div");
        cancelButton.className = "editableInputField-dialog-button editableInputField-dialog-cancelButton";
        cancelButton.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-x\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line></svg>"

        buttonContainer.append(confirmButton);
        buttonContainer.append(cancelButton);

        this.dialogDOM = {
            container: buttonContainer,
            confirmButton: confirmButton,
            cancelButton: cancelButton,
        }

        return buttonContainer;
    };

    deactivate = function(){
        this.isactive = false;
        //create div
        let textContainer = document.createElement("div");
        textContainer.className = "quill-render-text ";
        textContainer.insertAdjacentHTML("beforeend", this.quill.getSemanticHTML())
        this.container.innerHTML = "";
        this.container.classList.add(EditableInputField.#cssHiddenClassName);
        this.container.classList.remove(EditableInputField.#cssActiveClassName);
        this.container.append(textContainer);

        this.container.addEventListener("click", (e) => {
            e.preventDefault();
            if(!this.isactive){
                this.activate();
            }
        });

    }

    setupEventHandlers = function(editableInputFieldHTML){
        this.dialogDOM.confirmButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.callback.onConfirm(this);
            this.deactivate();
        })
        this.dialogDOM.cancelButton.addEventListener("click", function(e){
            e.preventDefault();
            e.stopPropagation();
            this.deactivate();
        })
        //limit character amount
        if (this.limit > 0) {
            this.quill.on('text-change', (delta, old, source) => {
                if (this.quill.getLength() > this.limit) {
                    this.quill.deleteText(this.limit, this.quill.getLength());
                }
            });
        }

    }

    activate = function(){
        if(this.readOnly) return false;
        this.isactive = true;
        this.container;
        this.container.classList.remove(EditableInputField.#cssHiddenClassName);
        this.container.classList.add(EditableInputField.#cssActiveClassName);
        this.container.innerHTML = "";
        this.container.append(this.quillcontainer);
        //build dialog buttons
        var buttons = this.buildHTML();
        //append to container
        this.container.append(buttons);
        this.setupEventHandlers(buttons);
    }

    isActive = function(){
        return this.isactive;
    };

    getQuill = function() {
        return this.quill;
    }

    getHtmlContent = function() {
        return this.quill.getSemanticHTML();
    }

    reset = function(container, deltaContent, type, callback, args) {
        let resetObj = this.constructor(container, deltaContent, type, callback, args);
        return resetObj;
    }
}