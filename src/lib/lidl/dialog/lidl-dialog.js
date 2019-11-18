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
     * @param targetElementId selector for the element[s] to trigger the dialog
     * @param action function to execute when dialog is confirmed
     * @param type type of dialog box. Currently supported: confirmDelete, imageUpload
     * @param content JSON object containing the following data: title, message, confirmMessage
     *
     * @class
     * @constructor
     *
     */

    lidl.Dialog = function (token, targetElementId, action, type, content) {

        this.token = token;
        this.targetElementId = targetElementId;
        this.action = action;
        this.type = type;
        this.content = content;

        this.typeInt = getTypeInt(type);

        this.htmlDialog = generateDialogHTML(this);
        registerTarget(targetElementId, this.htmlDialog);
    };

    var getTypeInt = function (type) {

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
        }

        return int;
    };


    var generateDialogHTML = function(self){

        // common html

        var htmlLidlDialog = $('<div/>', {
            "id": this.token,
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
            "text": self.content.title
        });

        var htmlDialogMessage = $('<div/>', {
            "class": "dialog-message dialog-part",
            "text": self.content.message
        });

        var htmlDialogButtons = $('<div/>', {
            "class": "dialog-buttons"
        });

        var htmlDialogConfirmButton = $('<div/>', {
            "id": "confirmBtn"+self.token,
            "class": "dialog-button dialog-confirm",
            "text": "Bestätigen"

        }).on('click', function(){confirmDialog(self)});

        var htmlDialogCancelButton = $('<div/>', {
            "class": "dialog-button dialog-cancel",
            "text": "Abbrechen"
        }).on('click', function(){closeDialog(htmlLidlDialog)});

        var htmlDialogButtonClear = $('<div/>', {
            "class": "clear",
        });

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
                "id": "imgUpload",
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
        self.action();
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

    var registerTarget = function(selector, target){
        $(selector).each(function(){
            $(this).on("click", function(){openDialog(target)});
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
}
(lidl = window.lidl || {},jQuery));
