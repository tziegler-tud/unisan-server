(function (common, $, undefined) {

    /**
     * @namespace: editableInputField
     */

    common.editableInputFieldCounter = 0;

    common.EditableInputField = function(container, deltaContent, htmlContent, type, callback, args){
        if (container === undefined) throw new Error("cannot instantiate input field without container");
        callback === undefined ? this.callback = {onConfirm: function(){console.log("no callback given")}}: this.callback = callback;
        common.editableInputFieldCounter++;
        this.id = common.editableInputFieldCounter;
        args = applyArgs(args);

        container.classList.add("editableInputField", "input-hidden", "allow-editing");
        this.args = args;
        this.container = container;
        this.deltaContent = deltaContent;
        this.htmlContent = htmlContent;
        this.domElements = {};

        //deactivate on default
        this.deactivate();

        var self = this;

        return this;
    };

    var applyArgs = function(args){
        args = (args === undefined) ? {}: args;
        return args;
    };

    var buildHTML = function(self){
        let id = self.id;
        let buttonContainer = document.createElement("div");
        buttonContainer.className = "editableInputField-dialog-container";
        buttonContainer.id= "editableInputField-dialog-container"+id;

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
    };
    
    common.EditableInputField.prototype.isActive = function(){
        return this.isactive;
    };

    common.EditableInputField.prototype.activate = function(){
        var self = this;
        self.isactive = true;
        let container = this.container;
        container.classList.remove("input-hidden");
        container.classList.add("input-active");
        let quillcontainer = document.createElement("div");
        quillcontainer.className = "text-editor"
        container.innerHTML = "";
        container.append(quillcontainer);

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

        //build dialog buttons
        var buttons = buildHTML(this);
        setupEventHandlers(this, buttons);

        //append to container
        container.append(buttons);
        self.quill = quill;
    }
    common.EditableInputField.prototype.deactivate = function(){
        let self = this;
        this.isactive = false;
        this.quill = undefined;
        //create div
        let textContainer = document.createElement("div");
        textContainer.className = "quill-render-text ";
        textContainer.insertAdjacentHTML("beforeend", this.htmlContent)
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

    common.EditableInputField.prototype.getQuill = function() {
        return this.quill;
    }

    common.EditableInputField.prototype.reset = function(container, deltaContent, htmlContent, type, callback, args) {
        let resetObj = this.constructor(container, deltaContent, htmlContent, type, callback, args);
        return resetObj;
    };


    return common.EditableInputField;

}(window.common = window.common||{}, jQuery, undefined));