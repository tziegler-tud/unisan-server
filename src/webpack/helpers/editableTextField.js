/**
 * @namespace: editableTextField
 */

import "./editableTextField.scss";
import "./editor.scss";
import Quill from "quill";
import '/lib/quill/quill.snow-custom.css';
import '/lib/quill/quill.bubble-custom.css';

/**
 * constructor for EditableTextField objects
 *
 * @param {HTMLElement}container - container dom element
 * @param {Object} deltaContent - delta object to set as content
 * @param {String} htmlContent - html content for rendering
 * @param {Object} callback - callbacks to be executed when dialog buttons are used. currently, only 'onConfirm' is supported
 * @param {Object} args - readOnly: [false] disable input., active: [false] initialize with active editor, disableButtons: [false] disables dialog buttons
 * @returns {Window.EditableTextField}
 * @constructor
 */
var EditableTextField = function(container, deltaContent, htmlContent, callback, args){
    if (container === undefined) throw new Error("cannot instantiate search bar without container");
    callback === undefined ? this.callback = {onConfirm: function(){console.log("no callback given")}}: this.callback = callback;
    this.id = EditableTextField.counter.next();
    args = applyArgs(args);
    container.classList.add("editableTextField", "editor-hidden");
    if(!args.readOnly) {
        container.classList.add("allow-editing");
    }
    this.args = args;
    this.container = container;
    this.deltaContent = deltaContent;
    this.htmlContent = htmlContent;
    this.domElements = {};

    //deactivate on default
    if (args.active === true){
        this.activate();
    }
    else {
        this.deactivate();
    }

    var self = this;

    return this;
};
EditableTextField.counter = {
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
    }
    args = (args === undefined) ? {}: args;
    return Object.assign(defaults, args);
};

var buildHTML = function(self){

    let id = self.id;
    let buttonContainer = document.createElement("div");
    buttonContainer.className = "editableTextField-dialog-container";
    buttonContainer.id= "editableTextField-dialog-container"+id;
    if (self.args.disableButtons === true) buttonContainer.style.display = "none";

    //add confirm button
    let confirmButton = document.createElement("div");
    confirmButton.className = "editableTextField-dialog-button editableTextField-dialog-confirmButton";
    confirmButton.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-check\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg>"

    //add cancel button
    let cancelButton = document.createElement("div");
    cancelButton.className = "editableTextField-dialog-button editableTextField-dialog-cancelButton";
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

var setupEventHandlers = function(self, EditableTextFieldHTML){
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
};

EditableTextField.prototype.isActive = function(){
    return this.isactive;
};

EditableTextField.prototype.activate = function(){
    var self = this;
    if(self.args.readOnly) return false;
    self.isactive = true;
    let container = this.container;
    container.classList.remove("editor-hidden");
    container.classList.add("editor-active");
    let quillcontainer = document.createElement("div");
    quillcontainer.className = "text-editor"
    container.innerHTML = "";
    container.append(quillcontainer);

    var toolbarOptions = [
        ['bold', 'italic', 'underline'/*, 'strike'*/],        // toggled buttons
        // ['blockquote', 'code-block'],
        // ['link', 'image'],
        [ 'link', 'image', 'video' ],

        // [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        // [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        // [{ 'direction': 'rtl' }],                         // text direction

        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],

        ['clean']                                         // remove formatting button
    ];

    const quill = new Quill(quillcontainer, {
        theme: 'snow',
        // theme: 'bubble',
        modules: {
            toolbar: toolbarOptions,
        },
        bounds: quillcontainer,

    });
    quill.setContents(this.deltaContent);

    //build dialog buttons
    var buttons = buildHTML(this);
    setupEventHandlers(this, buttons);

    //append to container
    container.append(buttons);
    self.quill = quill;
}
EditableTextField.prototype.deactivate = function(){
    let self = this;
    this.isactive = false;
    this.quill = undefined;
    //create div
    let textContainer = document.createElement("div");
    textContainer.className = "quill-render-text ql-editor";
    textContainer.insertAdjacentHTML("beforeend", self.htmlContent)
    self.container.innerHTML = "";
    self.container.classList.add("editor-hidden");
    self.container.classList.remove("editor-active");
    self.container.append(textContainer);

    self.container.addEventListener("click", function(e){
        e.preventDefault();
        if(!self.isactive){
            self.activate();
        }
    });

    //preserve link behaviour
    $(self.container).find("a").on("click", function(e){
        e.stopPropagation();
    })
}

EditableTextField.prototype.getQuill = function() {
    return this.quill;
}

EditableTextField.prototype.reset = function(container, deltaContent, htmlContent, callback, args) {
    let resetObj = this.constructor(container, deltaContent, htmlContent, callback, args);
    return resetObj;
};

export {EditableTextField}