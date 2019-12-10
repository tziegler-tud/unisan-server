/**
 *
 * lidl dialog
 *
 * pop-up dialog to confirm action
 *
 * registers an onclick handler to the target element.
 *
 * @author: Tom Ziegler
 * @version: 0.1b
 *
 *
 * @namespace lidl
 *
 *
 *************/

(function (lidl,$,undefined) {

    /**
     *
     * Constructor of dialog object
     *
     * @param token lidl token
     * @param targetElementSelector selector for the element[s] to trigger the dialog
     * @param action function to execute when dialog is confirmed
     * @param type type of dialog box. Currently supported: confirmDelete, imageUpload, removeDBKey, addDBKey
     * @param content JSON object containing the following data: title, message, confirmMessage
     * @param args function to be executed when calling the action function. Use this to access information from inside the dialog function.
     *
     * @class
     * @constructor
     *
     */

    lidl.Dialog = function (token, targetElementSelector, type, content, args) {

        this.token = token;
        this.targetElementSelector = targetElementSelector;
        this.type = type;
        this.content = content;

        this.args = args;

        this.typeInt = getTypeInt(this,type);

        this.htmlDialog = generateDialogHTML(this);
        registerTarget(this, targetElementSelector, this.htmlDialog);
    };

    var getTypeInt = function (self, type) {

        var int = 0;

        switch(type) {
            default:
                int = 0;
                break;

            case 'confirmDelete':
                int = 0;
                break;

            case 'imageUpload':
                int = 1;
                break;

            case 'removeDBKey':
                int = 0;
                break;

            case 'addDBKey':
                int = 2;
                break;
        }

        return int;
    };


    var generateDialogHTML = function(self){

        // common html

        var htmlLidlDialog = $('<div/>', {
            "id": self.token,
            "class": "lidl-dialog"
        });

        var htmlDialogInner = $('<div/>', {
            "class": "dialog-container-inner"
        });


        var htmlDialogWrapper = $('<div/>', {
            "class": "dialog-wrapper"
        });


        var htmlDialogBox = $('<div/>', {
            "class": "dialog-box"
        });

        var htmlDialogBoxInner = $('<div/>', {
            "class": "dialog-box-inner"
        });

        var htmlDialogTitle = $('<div/>', {
            "class": "dialog-title dialog-part",
            "text": self.content.title + self.content.titleArg
        });

        var htmlDialogMessage = $('<div/>', {
            "class": "dialog-message dialog-part",
            "text": self.content.message + self.content.messageArg
        });

        var htmlDialogButtons = $('<div/>', {
            "class": "dialog-buttons"
        });

        var htmlDialogConfirmButton = $('<div/>', {
            "id": "confirmBtn"+self.token,
            "class": "dialog-button dialog-confirm",
            "text": "Bestätigen"

        }).on('click', function(){confirmAndClose(self)});

        var htmlDialogCancelButton = $('<div/>', {
            "class": "dialog-button dialog-cancel",
            "text": "Abbrechen"
        }).on('click', function(){closeDialog(htmlLidlDialog)});

        var htmlDialogButtonClear = $('<div/>', {
            "class": "clear",
        });

        self.title = htmlDialogTitle;
        self.message = htmlDialogMessage;

        // type-dependent html & wrap-up

        if(self.typeInt === 0){
            $(htmlLidlDialog).addClass("dialog-confirmDelete");


            htmlDialogButtons.append(htmlDialogConfirmButton, htmlDialogCancelButton, htmlDialogButtonClear);
            htmlDialogBox.append(htmlDialogBoxInner.append(htmlDialogTitle, htmlDialogMessage, htmlDialogButtons));
            htmlLidlDialog.append(htmlDialogInner.append(htmlDialogWrapper.append(htmlDialogBox)));
            $('body').append(htmlLidlDialog);
            return htmlLidlDialog;
        }

        if(self.typeInt === 1){

            $(htmlLidlDialog).addClass("dialog-uploadImage");

            htmlDialogMessage = $('<div/>', {
                "class": "dialog-message dialog-part",
                "id": "imgUpload-" + self.token,
            });

            htmlDialogConfirmButton.text("Speichern");

            htmlDialogButtons.append(htmlDialogConfirmButton, htmlDialogCancelButton, htmlDialogButtonClear);
            htmlDialogBox.append(htmlDialogBoxInner.append(htmlDialogTitle, htmlDialogMessage, htmlDialogButtons));
            htmlLidlDialog.append(htmlDialogInner.append(htmlDialogWrapper.append(htmlDialogBox)));
            $('body').append(htmlLidlDialog);
            return htmlLidlDialog;
        }

        if(self.typeInt === 2){

            $(htmlLidlDialog).addClass("dialog-addDBKey");

            htmlDialogMessage = $('<div/>', {
                "class": "dialog-message dialog-part",
                "id": "addDBKey-" + self.token,
            });

            htmlDialogConfirmButton.text("Speichern");

            htmlDialogButtons.append(htmlDialogConfirmButton, htmlDialogCancelButton, htmlDialogButtonClear);
            htmlDialogBox.append(htmlDialogBoxInner.append(htmlDialogTitle, htmlDialogMessage, htmlDialogButtons));
            htmlLidlDialog.append(htmlDialogInner.append(htmlDialogWrapper.append(htmlDialogBox)));
            $('body').append(htmlLidlDialog);
            return htmlLidlDialog;
        }

    };

    var confirmDialog = function(self){
        var args = self.args;
        var res = self;
        args.callback.onConfirm(res);
    };

    var confirmAndClose = function(self){
        confirmDialog(self);
        closeDialog(self.htmlDialog);
    };

    var openDialog = function(target){
        $(target).each(function(){
            $(this).addClass("dialog-active");
        });
    };

    var closeDialog = function(target){
        $(target).each(function() {
            $(this).removeClass("dialog-active");
        });
    };

    var registerTarget = function(self, selector, target){
        $(selector).each(function(){
            $(this).on("click", function(e){
                self.event = e;
                self.title.text(self.content.title + (e.target.dataset.dialogtitlearg === undefined ? "" :  " " + e.target.dataset.dialogtitlearg));
                self.message.text(self.content.message + (e.target.dataset.dialogbodyarg === undefined ? "" : " " + e.target.dataset.dialogbodyarg));
                openDialog(target)});
        })
    };

    lidl.Dialog.prototype.openDialog = function(){
        openDialog(this.htmlDialog);
    };

    lidl.Dialog.prototype.closeDialog = function(){
        closeDialog(this.htmlDialog);
    };

    lidl.Dialog.prototype.confirmDialog = function(){
        confirmDialog(this);
    };

    lidl.Dialog.prototype.confirmAndClose = function(){
        confirmAndClose(this);
    };
}
(lidl = window.lidl || {},jQuery));
