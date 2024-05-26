/**
 * @namespace: editableInputField
 */

import "./editableInputField.scss";
import "./editor.scss";
import Quill from "quill";
import '/lib/quill/quill.snow-custom.css';
import '/lib/quill/quill.bubble-custom.css';

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
var EditableInputField = function(container, deltaContent, type="text", callback, args){
    if (container === undefined) throw new Error("cannot instantiate input field without container");
    callback === undefined ? this.callback = {onConfirm: function(){console.log("no callback given")}}: this.callback = callback;
    this.id = EditableInputField.counter.next();
    args = applyArgs(args);
    container.classList.add("editableInputField", "input-hidden");
    if(!args.readOnly) {
        container.classList.add("allow-editing");
    }
    this.args = args;
    this.container = container;
    this.deltaContent = deltaContent;
    this.domElements = {};

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

    const quill = new Quill(quillcontainer, {
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
    return this;
};
EditableInputField.counter = {
    current: 0,
    next: function(){
        this.current++;
        return this.current;
    }
};

var applyArgs = function(args){
    let defaults = {
        active: false,
        disableButtons: false,
        readOnly: false,
        limit: 0,
    }
    args = (args === undefined) ? {}: args;
    return Object.assign(defaults, args);
};

var buildHTML = function(self){
    let id = self.id;
    let buttonContainer = document.createElement("div");
    buttonContainer.className = "editableInputField-dialog-container";
    buttonContainer.id= "editableInputField-dialog-container"+id;
    if (self.args.disableButtons === true) buttonContainer.style.display = "none";

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

    self.dialogDOM = {
        container: buttonContainer,
        confirmButton: confirmButton,
        cancelButton: cancelButton,
    }

    return buttonContainer;
};

var setupEventHandlers = function(self, editableInputFieldHTML){
    self.dialogDOM.confirmButton.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        self.callback.onConfirm(self);
        self.deactivate();
    })
    self.dialogDOM.cancelButton.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        self.deactivate();
    })
    //limit character amount
    if (self.args.limit > 0) {
        self.quill.on('text-change', function(delta, old, source) {
            if (self.quill.getLength() > self.args.limit) {
                self.quill.deleteText(self.args.limit, self.quill.getLength());
            }
        });
    }

};

EditableInputField.prototype.isActive = function(){
    return this.isactive;
};

EditableInputField.prototype.activate = function(){
    var self = this;
    if(self.args.readOnly) return false;
    self.isactive = true;
    let container = this.container;
    container.classList.remove("input-hidden");
    container.classList.add("input-active");
    let quillcontainer = document.createElement("div");
    quillcontainer.className = "text-editor"
    container.innerHTML = "";
    container.append(quillcontainer);

    //build dialog buttons
    var buttons = buildHTML(this);

    //append to container
    container.append(buttons);
    setupEventHandlers(this, buttons);
}
EditableInputField.prototype.deactivate = function(){
    let self = this;
    this.isactive = false;
    //create div
    let textContainer = document.createElement("div");
    textContainer.className = "quill-render-text ";
    textContainer.insertAdjacentHTML("beforeend", this.quill.getSemanticHTML())
    this.container.innerHTML = "";
    this.container.classList.add("input-hidden");
    this.container.classList.remove("input-active");
    this.container.append(textContainer);

    this.container.addEventListener("click", function(e){
        e.preventDefault();
        if(!self.isactive){
            self.activate();
        }
    });

}

EditableInputField.prototype.getQuill = function() {
    return this.quill;
}

EditableInputField.prototype.getHtmlContent = function() {
    return this.quill.getSemanticHTML();
}


EditableInputField.prototype.reset = function(container, deltaContent, type, callback, args) {
    let resetObj = this.constructor(container, deltaContent, type, callback, args);
    return resetObj;
};

export{EditableInputField}