var lidlRTO = window.lidlRTO;
var common = window.common;
var actions = window.actions;

$(document).ready (function () {

    const content = {
        title: "Nutzer löschen",
        message: "U sure bro?",
        titleArg: "",
        messageArg: ""
    };

    var userid = window.exploreUserId;

    var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

    var args = {
        userid: userid,
        callback: {
            onConfirm: function(){
                actions.deleteUser(userid)
            }
        }
    };

    var token = lidlRTO.objectManager.createNewObjectToken();
    const dialog01 = new lidl.Dialog(token, ".userDelete", 'confirmDelete', content, args);
    lidlRTO.objectManager.addObject(dialog01, token);


    const content2 = {
        title: "Bild hochladen",
    };

    var removeUseritemAction = function(args){

    };

    var args2 = {
        userid: userid,
        callback: {
            onConfirm: function(){}
        }
    };

    var token2 = lidlRTO.objectManager.createNewObjectToken();
    const dialog02 = new lidl.Dialog(token2, ".changeProfilePicture", 'imageUpload', content2, args2);
    lidlRTO.objectManager.addObject(dialog02, token2);


    const content3 = {
        title: "Attribut löschen",
        message: "Folgendes Attribut wird gelöscht:",
        titleArg: "",
        messageArg: ""
        };

    // have faith, young padawan. Maybe this will work.
    const args03 = {
        userid: userid,
        callback: {
            onConfirm: function(res){
                actions.removeDBKey(userid, res.event.target.dataset.attributekey, {}, function(){
                    $("#useritem-"+ common.escapeSelector(res.event.target.dataset.attributekey)).remove()
                }
            );
            }
        }
    };

    var token3 = lidlRTO.objectManager.createNewObjectToken();
    const dialog03 = new lidl.Dialog(token3, ".useredit-removeItemBtn", 'removeDBKey', content3, args03);
    lidlRTO.objectManager.addObject(dialog03, token3);


    var manualUploader = new qq.FineUploader({
        element: document.getElementById('imgUpload-' + token2),
        template: 'qq-template-manual-trigger',
        request: {
            method: 'POST',
            endpoint: '/unisams/usermod/' + userid + "/uploadUserImage",
            inputName: 'image'

        },
        thumbnails: {
            placeholders: {
                waitingPath: '/lib/fineUploader/placeholders/waiting-generic.png',
                notAvailablePath: '/lib/fineUploader/placeholders/not_available-generic.png'
            }
        },
        autoUpload: false,
        debug: true,
        multiple: false,

        callbacks: {
            onComplete: function(){
                const items = $(".userProfileImage");
                $(items).each(function(img){
                    const src = $(this).attr("src");
                    $(this).attr("src", src + "?t=" + new Date().getTime());
                });
                dialog02.confirmAndClose();
            }
        }
    });

    qq(document.getElementById("confirmBtn" + token2)).attach("click", function() {
        manualUploader.uploadStoredFiles();
    });

    var addDBKey_sidebar = new common.Sidebar('wrapper', {title: "Test"});

    $(".useredit-addItemBtn").on("click", function(e) {
        e.preventDefault();
        addDBKey_sidebar.addContent('UserAddDBKey', {
            userid: userid,
            callback: {
                onConfirm: function(userid, key, value){
                    actions.insertDBKey(userid, key, value);
                }
            }
            },
        );
        addDBKey_sidebar.show();
    });
    $(".useredit-addQualificationBtn").on("click", function(e) {
        e.preventDefault();
        addDBKey_sidebar.addContent('UserAddQualification', {
                userid: userid,
                callback: {
                    onConfirm: function(userid, value){
                        var key = "qualifications";
                        var args = {
                            isArray: true
                        };
                        actions.insertDBKey(userid, key, value, args, function(){

                        });
                    }
                },
            },
        );
        addDBKey_sidebar.show();
    });

    $(".quallist-entry").on("click", function(e) {
        e.preventDefault();
        var self = this;

        addDBKey_sidebar.addContent('UserUpdateQualification', {
                userid: userid,
                qualificationId: self.dataset.qualificationid,
                callback: {
                    onConfirm: function(userid, value){
                        var key = "qualifications";
                        var args = {
                            isArray: true
                        };
                        actions.insertDBKey(userid, key, value, args, function(){

                        });
                    },
                    onDelete: function(userid, value){
                        var key = "qualifications";
                        var args = {
                            isArray: true
                        };

                        const dialog_content = {
                            title: "Qualifikation löschen",
                            message: "Folgende Qualifikation wird gelöscht: " + value.qualification.name,
                            titleArg: "",
                            messageArg: ""
                        };
                        var dialog_token = lidlRTO.objectManager.createNewObjectToken();
                        const dialog_args = {
                            userid: userid,
                            callback: {
                                onConfirm: function(res){
                                    actions.removeDBKey(userid,key, value, args,function(){
                                        $("#qualId" + common.escapeSelector(value.id)).remove();
                                    });
                                    lidlRTO.objectManager.removeObject(dialog_token);
                                }
                            }
                        };
                        const dialog = new lidl.Dialog(dialog_token, null, 'removeDBKey', dialog_content, dialog_args);
                        lidlRTO.objectManager.addObject(dialog, dialog_token);
                        dialog.openDialog();
                    }
                },
            },
        );
        addDBKey_sidebar.show();
    });


    $(".useredit-saveItemBtn").each(function(){
        const token = lidlRTO.objectManager.createNewObjectToken();
        var btn = new lidl.Button(token, this, {
            enabled: false,
            classes: {
                onEnabled: "enabled",
                onDisabeld: "disabled"
            }
        });
        var key = btn.element.dataset.attributekey;
        var val = btn.element.dataset.attributeval;
        btn.addAction("click",function(){
            var inp = $("#userinp-" + common.escapeSelector(key));
            actions.updateDBKey(userid, btn.element.dataset.attributekey, inp.val());
            inp.data("resetVal" ,inp.val());
            inp.trigger("inputReset");
            btn.disable();
        });
        var el = $("#userinp-" + common.escapeSelector(key));
        el.on("input", function() {
           btn.enable();
        });
        el.on("inputReset", function() {
            btn.disable();
        });
        lidlRTO.objectManager.addObject(btn, token);
    });

    $(".useredit-resetItemBtn").each(function(){
        const token = lidlRTO.objectManager.createNewObjectToken();
        var btn = new lidl.Button(token, this, {
            enabled: false,
            classes: {
                onEnabled: "enabled",
                onDisabeld: "disabled"
            }
        });
        var key = btn.element.dataset.attributekey;
        var val = btn.element.dataset.attributeval;
        btn.addAction("click",function(){
            var inp = $("#userinp-" + common.escapeSelector(key));
            inp.val(btn.element.dataset.attributeval);
            inp.trigger("inputReset");
            btn.disable();

        });
        var inp = $("#userinp-" + common.escapeSelector(key));
        inp.data("resetVal" ,inp.val());
        inp.on("input", function() {
            btn.enable();
        });
        inp.on("inputReset", function(e) {
            var inp = $(e.target);
            inp.val(inp.data("resetVal"));
            btn.disable();
        });
        lidlRTO.objectManager.addObject(btn, token);
    });
});