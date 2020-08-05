(function (common, $, undefined) {

    /**
     * @namespace: editableTextField
     */

    common.editableTextFieldCounter = 0;

    common.EditableTextField = function(container, deltaContent, htmlContent, callback, args){
        if (container === undefined) throw new Error("cannot instantiate search bar without container");
        callback === undefined ? this.callback = {onConfirm: function(){console.log("no callback given")}}: this.callback = callback;
        common.editableTextFieldCounter++;
        this.id = common.editableTextFieldCounter;
        args = applyArgs(args);

        container.classList.add("editableTextField", "editor-hidden", "allow-editing");
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
        buttonContainer.className = "editableTextField-dialog-container";
        buttonContainer.id= "editableTextField-dialog-container"+id;

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
    
    common.EditableTextField.prototype.isActive = function(){
        return this.isactive;
    };

    common.EditableTextField.prototype.activate = function(){
        var self = this;
        self.isactive = true;
        let container = this.container;
        container.classList.remove("editor-hidden");
        container.classList.add("editor-active");
        let quillcontainer = document.createElement("div");
        quillcontainer.className = "text-editor"
        container.innerHTML = "";
        container.append(quillcontainer);

        const quill = new Quill(quillcontainer, {
            theme: 'snow',
            // theme: 'bubble',
            // modules: {
            //     toolbar: '#toolbar'
            // },
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
    common.EditableTextField.prototype.deactivate = function(){
        let self = this;
        this.isactive = false;
        this.quill = undefined;
        //create div
        let textContainer = document.createElement("div");
        textContainer.className = "quill-render-text ql-editor";
        textContainer.insertAdjacentHTML("beforeend", this.htmlContent)
        this.container.innerHTML = "";
        this.container.classList.add("editor-hidden");
        this.container.classList.remove("editor-active");
        this.container.append(textContainer);

        this.container.addEventListener("click", function(e){
            e.preventDefault();
            if(!self.isactive){
                self.activate();
            }
        });

        //preserve link behaviour
        $("a").on("click", function(e){
            e.stopPropagation();
        })
    }

    common.EditableTextField.prototype.getQuill = function() {
        return this.quill;
    }

    common.EditableTextField.prototype.reset = function(container, deltaContent, htmlContent, callback, args) {
        let resetObj = this.constructor(container, deltaContent, htmlContent, callback, args);
        return resetObj;
    };


    return common.EditableTextField;

}(window.common = window.common||{}, jQuery, undefined));