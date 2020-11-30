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
     * @param {Object} callback callback functions for dialog interaction. Currently supported: onCancel, onConfirm
     *
     * @class
     * @constructor
     *
     */

    lidl.Dialog = function (token, targetElementSelector, type, content, args, callback) {

        this.token = token;
        this.targetElementSelector = targetElementSelector;
        this.type = type;
        this.content = content;

        this.args = args;
        this.callback = verifyCallback(callback, args);

        this.typeInt = getTypeInt(this,type);

        this.allowConfirm = true;
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

            case 'confirmChange':
                int = 1;
                break;

            case 'imageUpload':
                int = 2;
                break;

            case 'removeDBKey':
                int = 0;
                break;

            case 'addDBKey':
                int = 3;
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

        var bgHelper = $('<div/>', {
            "class": "lidl-dialog-background"
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
        });

        var htmlDialogTitleInner = $('<span/>', {
            "class": "",
            "text": self.content.title + self.content.titleArg
        });

        htmlDialogTitle.append(htmlDialogTitleInner);

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
        }).on('click', function(e){confirmAndClose(self, e)});

        var htmlDialogCancelButton = $('<div/>', {
            "class": "dialog-button dialog-cancel",
            "text": "Abbrechen"
        }).on('click', function(){self.cancelDialog(htmlLidlDialog)});

        var htmlDialogButtonClear = $('<div/>', {
            "class": "clear",
        });

        self.title = htmlDialogTitleInner;
        self.message = htmlDialogMessage;
        self.confirmBtn = htmlDialogConfirmButton;
        self.cancelBtn = htmlDialogCancelButton;
        self.overlay = bgHelper;

        // type-dependent html & wrap-up

        if(self.typeInt === 0){
            $(htmlLidlDialog).addClass("dialog-confirmDelete");


            htmlDialogButtons.append(htmlDialogConfirmButton, htmlDialogCancelButton, htmlDialogButtonClear);
            htmlDialogBox.append(htmlDialogBoxInner.append(htmlDialogTitle, htmlDialogMessage, htmlDialogButtons));
            htmlLidlDialog.append(bgHelper, htmlDialogInner.append(htmlDialogWrapper.append(htmlDialogBox)));
            $('body').append(htmlLidlDialog);
            return htmlLidlDialog;
        }

        if(self.typeInt === 1){
            $(htmlLidlDialog).addClass("dialog-confirmChange");


            htmlDialogButtons.append(htmlDialogConfirmButton, htmlDialogCancelButton, htmlDialogButtonClear);
            htmlDialogBox.append(htmlDialogBoxInner.append(htmlDialogTitle, htmlDialogMessage, htmlDialogButtons));
            htmlLidlDialog.append(bgHelper, htmlDialogInner.append(htmlDialogWrapper.append(htmlDialogBox)));
            $('body').append(htmlLidlDialog);
            return htmlLidlDialog;
        }

        if(self.typeInt === 2){

            $(htmlLidlDialog).addClass("dialog-uploadImage dialog-fullscreen");

            htmlDialogMessage = $('<div/>', {
                "class": "dialog-message dialog-part",
                "id": "imgUpload-" + self.token,
            });
            let htmlDialogImage = $('<div/>', {
                "class": "dialog-imageViewer dialog-part",
                "id": "imgViewer-" + self.token,
            });
            let img = $("<div class=\"dialog-imageContainer\"><img class=\"imagePreview userProfileImage\" src=\"/data/uploads/user_images/" + window.exploreUserId + "/" + window.exploreUserId +".jpg\" data-originalsrc = \"/data/uploads/user_images/" + window.exploreUserId + "/" + window.exploreUserId +".jpg\"></div>");
            htmlDialogConfirmButton.text("Speichern");
            htmlDialogConfirmButton.addClass("has-tooltip")
            htmlDialogImage.append(img)

            var tooltipConfirmDisabled = $('<span/>', {
                "class": "tooltip",
                "text": "Kein Bild zum Upload gewählt"
            });
            htmlDialogConfirmButton.append(tooltipConfirmDisabled);

            htmlDialogButtons.append(htmlDialogConfirmButton, htmlDialogCancelButton, htmlDialogButtonClear);
            htmlDialogBox.append(htmlDialogBoxInner.append(htmlDialogTitle, htmlDialogImage, htmlDialogMessage, htmlDialogButtons));
            htmlLidlDialog.append(bgHelper, htmlDialogInner.append(htmlDialogWrapper.append(htmlDialogBox)));

            $('body').append(htmlLidlDialog);
            self.disableConfirm();
            return htmlLidlDialog;
        }

        if(self.typeInt === 3){

            $(htmlLidlDialog).addClass("dialog-addDBKey");

            htmlDialogMessage = $('<div/>', {
                "class": "dialog-message dialog-part",
                "id": "addDBKey-" + self.token,
            });

            htmlDialogConfirmButton.text("Speichern");

            htmlDialogButtons.append(htmlDialogConfirmButton, htmlDialogCancelButton, htmlDialogButtonClear);
            htmlDialogBox.append(htmlDialogBoxInner.append(htmlDialogTitle, htmlDialogMessage, htmlDialogButtons));
            htmlLidlDialog.append(bgHelper, htmlDialogInner.append(htmlDialogWrapper.append(htmlDialogBox)));
            $('body').append(htmlLidlDialog);
            return htmlLidlDialog;
        }

    };

    var confirmDialog = function(self){
        if (!self.allowConfirm) return false;
        var res = self;
        self.callback.onConfirm(res);
    };

    var confirmAndClose = function(self ){
        if (!self.allowConfirm) return false;
        confirmDialog(self);
        closeDialog(self.htmlDialog);
    };

    var openDialog = function(self){
        //prevent interaction with background
        $(self.overlay).on("click", function(e){
            e.stopPropagation();
            self.cancelDialog();
        })
        document.body.classList.add("dialog-active")
        $(self.htmlDialog).each(function(){
            let self = this;
            $(this).css({
                "display": "block"
            });
            $(this).addClass("dialog-active");
            $(this).find(".dialog-wrapper")[0].animate([
                // keyframes
                { transform: 'translateX(100%)' },
                { transform: 'translateX(0)' }
            ], {
                // timing options
                duration: 250,
                iterations: 1
            });

        });
    };

    var closeDialog = function(target){
        document.body.classList.remove("dialog-active")
        $(target).each(function() {
            let ob = this;
            $(this).removeClass("dialog-active");
            $(this).find(".dialog-wrapper")[0].animate([
                // keyframes
                { transform: 'translateX(0)' },
                { transform: 'translateX(100%)' }
            ], {
                // timing options
                duration: 250,
                iterations: 1
            });
            setTimeout(function(){
                $(ob).css({
                    "display": "none"
                });
            }, 250);
        });

    };

    var registerTarget = function(self, selector, target){
        if (selector == null) return;
        $(selector).each(function(){
            $(this).on("click", function(e){
                e.stopPropagation();
                self.event = e;
                self.title.text(self.content.title + (e.target.dataset.dialogtitlearg === undefined ? "" :  " " + e.target.dataset.dialogtitlearg));
                self.message.text(self.content.message + (e.target.dataset.dialogbodyarg === undefined ? "" : " " + e.target.dataset.dialogbodyarg));
                openDialog(self)});
        })
    };

    lidl.Dialog.prototype.openDialog = function(){
        openDialog(this);
    };

    lidl.Dialog.prototype.closeDialog = function(){
        closeDialog(this.htmlDialog);
    };
    lidl.Dialog.prototype.cancelDialog = function(){
        closeDialog(this.htmlDialog);
        this.callback.onCancel();
    };

    lidl.Dialog.prototype.confirmDialog = function(){
        confirmDialog(this);
    };

    lidl.Dialog.prototype.confirmAndClose = function(){
        confirmAndClose(this);
    };

    lidl.Dialog.prototype.setCallback = function(cb){
        this.callback = verifyCallback(cb);
    }

    lidl.Dialog.prototype.enableConfirm = function(){
        this.confirmBtn.removeClass("btn-disabled");
        this.allowConfirm = true;
    }

    lidl.Dialog.prototype.disableConfirm = function(){
        this.confirmBtn.addClass("btn-disabled");
        this.allowConfirm = false;
    }

    lidl.Dialog.prototype.reset = function(){
        //not implemented
    }

    let verifyCallback = function(callback, args) {
        function isFunction(functionToCheck) {
            return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
        }
        //for downwards compatibility, try to find callback in args object if callback obj is undefined
        if (callback === undefined) {
            if (args.callback !== undefined) {
                callback = args.callback;
            }
        }
        let cb = {};
        //validate
        if (callback === undefined) callback = {};
        cb.onConfirm = isFunction(callback.onConfirm) ? callback.onConfirm : function(){return false};
        cb.onCancel = isFunction(callback.onCancel) ? callback.onCancel : function(){return false};
        return cb;
    }
}
(lidl = window.lidl || {},jQuery));
