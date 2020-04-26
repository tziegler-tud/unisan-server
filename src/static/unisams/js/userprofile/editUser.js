var lidlRTO = window.lidlRTO;
var common = window.common;
var actions = window.actions;

$(document).ready (function () {
    var url = "/unisams/usermod/" + window.exploreUserId;
    console.log(url);
    $.ajax({
        url: url,
        type: 'GET',
        cache: false,
        isModified: false,
        data: {},
        success: function (context) {
        buildPage(context)
        },
        error: function(context){
            alert(context.status);
        }
    });

    function buildPage(user) {
        var userid = window.exploreUserId;

        var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

        const deleteContent = {
            title: "Nutzer löschen",
            message: "U sure bro?",
            titleArg: "",
            messageArg: ""
        };

        var deleteArgs = {
            userid: userid,
            callback: {
                onConfirm: function () {
                    actions.deleteUser(userid)
                }
            }
        };

        var token = lidlRTO.objectManager.createNewObjectToken();
        const dialogDeleteUser = new lidl.Dialog(token, ".userDelete", 'confirmDelete', deleteContent, deleteArgs);
        lidlRTO.objectManager.addObject(dialogDeleteUser, token);


        const content2 = {
            title: "Bild hochladen",
        };

        var removeUseritemAction = function (args) {

        };

        var args2 = {
            userid: userid,
            callback: {
                onConfirm: function () {
                }
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
                onConfirm: function (res) {
                    actions.removeDBKey(userid, res.event.target.dataset.attributekey, {}, function () {
                            $("#useritem-" + common.escapeSelector(res.event.target.dataset.attributekey)).remove()
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
                onComplete: function () {
                    const items = $(".userProfileImage");
                    $(items).each(function (img) {
                        const src = $(this).attr("src");
                        $(this).attr("src", src + "?t=" + new Date().getTime());
                    });
                    dialog02.confirmAndClose();
                }
            }
        });

        qq(document.getElementById("confirmBtn" + token2)).attach("click", function () {
            manualUploader.uploadStoredFiles();
        });

        var addDBKey_sidebar = new common.Sidebar('wrapper', {title: "Test"});

        $(".useredit-addItemBtn").on("click", function (e) {
            e.preventDefault();
            addDBKey_sidebar.addContent('UserAddDBKey', {
                    userid: userid,
                    callback: {
                        onConfirm: function (userid, key, value, args) {
                            actions.insertDBKey(userid, key, value, args);
                        }
                    }
                },
            );
            addDBKey_sidebar.show();
        });

        $(".useredit-addContactItemBtn").on("click", function (e) {
            e.preventDefault();
            var self = this;
            addDBKey_sidebar.addContent('UserAddContactDataKey', {
                    userid: userid,
                    catKey: self.dataset.catkey,
                    callback: {
                        onConfirm: function (userid, key, value, args) {
                            args = {
                                isArray: true,
                                noIndex: true
                            };
                            actions.insertDBKey(userid, key, value, args);
                        }
                    }
                },
            );
            addDBKey_sidebar.show();
        });

        $(".useredit-addGeneralItemBtn").on("click", function (e) {
            e.preventDefault();
            var self = this;
            addDBKey_sidebar.addContent('UserAddGeneralDataKey', {
                    userid: userid,
                    catKey: self.dataset.catkey,
                    callback: {
                        onConfirm: function (userid, key, value, args) {
                            actions.insertDBKey(userid, key, value, args);
                        }
                    }
                },
            );
            addDBKey_sidebar.show();
        });


        $(".useredit-addQualificationBtn").on("click", function (e) {
            e.preventDefault();
            var self = this;
            addDBKey_sidebar.addContent('UserAddQualification', {
                    userid: userid,
                    catKey: self.dataset.catkey,
                    callback: {
                        onConfirm: function (userid, key, value, args) {
                            args = {
                                isArray: true,
                                noIndex: true,
                            };
                            actions.insertDBKey(userid, key, value, args, function () {

                            });
                        }
                    },
                },
            );
            addDBKey_sidebar.show();
        });

        $(".quallist-entry").on("click", function (e) {
            e.preventDefault();
            var self = this;

            addDBKey_sidebar.addContent('UserUpdateQualification', {
                    userid: userid,
                    key: self.dataset.key,
                    keyId: self.dataset.keyid,
                    qualificationId: self.dataset.qualificationid,
                    callback: {
                        onConfirm: function (userid, key, value) {
                            var args = {
                                isArray: true, //we reference the element directly by array index
                                noIndex: false,
                                keyId: self.dataset.keyId
                            };
                            actions.insertDBKey(userid, key, value, args, function () {

                            });
                        },
                        onDelete: function (userid, key, data) {
                            var args = {
                                isArray: true
                            };

                            const dialog_content = {
                                title: "Qualifikation löschen",
                                message: "Folgende Qualifikation wird gelöscht: " + data.qualification.name,
                                titleArg: "",
                                messageArg: ""
                            };
                            var dialog_token = lidlRTO.objectManager.createNewObjectToken();
                            const dialog_args = {
                                userid: userid,
                                callback: {
                                    onConfirm: function (res) {
                                        actions.removeDBKey(userid, key, data, args, function () {
                                            $("#qualId" + common.escapeSelector(data.id)).remove();
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

        $(".userkey-entry").on("click", function (e) {
            e.preventDefault();
            var self = this;

            addDBKey_sidebar.addContent('UserUpdateDBKey', {
                    userid: userid,
                    keyId: self.dataset.keyid,
                    key: self.dataset.key,
                    catKey: self.dataset.catkey,
                    subKey: self.dataset.subkey,
                    combinedKey: self.dataset.combinedkey,
                    value: self.dataset.value,
                    isCustomEntry: self.dataset.iscustomentry,
                    callback: {
                        onConfirm: function (userid, key, value) {
                            var args = {
                                //isArray: false
                            };
                            actions.updateDBKey(userid, key, value, args, function () {
                                addDBKey_sidebar.hide();
                                $(e.currentTarget).find(".userkey-entry-value").html(value.value);
                                $(e.currentTarget).find(".userkey-entry-title").html(value.title);
                                e.currentTarget.dataset.value = value.value;
                                e.currentTarget.dataset.title = value.title;
                            });
                        },
                        onDelete: function (userid, key, data) {
                            var args = {
                                isArray: true
                            };

                            const dialog_content = {
                                title: "Eintrag löschen",
                                message: "Folgender Eintrag wird gelöscht: " + data.title,
                                titleArg: "",
                                messageArg: ""
                            };
                            var dialog_token = lidlRTO.objectManager.createNewObjectToken();
                            const dialog_args = {
                                userid: userid,
                                callback: {
                                    onConfirm: function (res) {
                                        actions.removeDBKey(userid, key, data, args, function () {
                                            $("#userkey-" + common.escapeSelector(key)).remove();
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

        // $(".usercontact-entry").on("click", function(e) {
        //     e.preventDefault();
        //     var self = this;
        //
        //     addDBKey_sidebar.addContent('UserUpdateContactKey', {
        //             userid: userid,
        //             keyId: self.dataset.keyid,
        //             key: self.dataset.key,
        //             catKey: self.dataset.catkey,
        //             title: self.dataset.title,
        //             subKey: self.dataset.subkey,
        //             value: self.dataset.value,
        //             callback: {
        //                 onConfirm: function(userid, key, value) {
        //                     var args = {
        //                         //isArray: false
        //                     };
        //                     actions.updateDBKey(userid, key, value, args, function(){
        //                         addDBKey_sidebar.hide();
        //                         $(e.currentTarget).find(".userkey-entry-value").html(value.value);
        //                         e.currentTarget.dataset.value = value.value;
        //                     });
        //                 },
        //                 onDelete: function(userid, key, data){
        //                     var args = {
        //                         isArray: true
        //                     };
        //
        //                     const dialog_content = {
        //                         title: "Eintrag löschen",
        //                         message: "Folgender Eintrag wird gelöscht: " + data.title,
        //                         titleArg: "",
        //                         messageArg: ""
        //                     };
        //                     var dialog_token = lidlRTO.objectManager.createNewObjectToken();
        //                     const dialog_args = {
        //                         userid: userid,
        //                         callback: {
        //                             onConfirm: function(res){
        //                                 actions.removeDBKey(userid, key, data, args, function(){
        //                                     $("#userkey-" + common.escapeSelector(key)).remove();
        //                                 });
        //                                 lidlRTO.objectManager.removeObject(dialog_token);
        //                             }
        //                         }
        //                     };
        //                     const dialog = new lidl.Dialog(dialog_token, null, 'removeDBKey', dialog_content, dialog_args);
        //                     lidlRTO.objectManager.addObject(dialog, dialog_token);
        //                     dialog.openDialog();
        //                 }
        //             },
        //         },
        //     );
        //     addDBKey_sidebar.show();
        // });

        $(".usercontact-entry").on("click", function (e) {
            e.preventDefault();
            var self = this;
            var keyId = self.dataset.keyid;
            var key = self.dataset.key;

            var field = common.refJSON(user, key);

            addDBKey_sidebar.addContent('UserUpdateContactKey', {
                    userid: userid,
                    key: key,
                    catKey: self.dataset.catkey,
                    field: field,
                    user: user,
                    callback: {
                        onConfirm: function (userid, key, value) {
                            var args = {
                                //isArray: false
                            };
                            actions.updateDBKey(userid, key, value, args, function () {
                                addDBKey_sidebar.hide();
                                $(e.currentTarget).find(".userkey-entry-value").html(value.value);
                                $(e.currentTarget).find(".userkey-entry-title").html(value.title);
                                e.currentTarget.dataset.value = value.value;
                                e.currentTarget.dataset.title = value.title;
                            });
                        },
                        onDelete: function (userid, key, data) {
                            var args = {
                                isArray: true
                            };

                            const dialog_content = {
                                title: "Eintrag löschen",
                                message: "Folgender Eintrag wird gelöscht: " + data.title,
                                titleArg: "",
                                messageArg: ""
                            };
                            var dialog_token = lidlRTO.objectManager.createNewObjectToken();
                            const dialog_args = {
                                userid: userid,
                                callback: {
                                    onConfirm: function (res) {
                                        actions.removeDBKey(userid, key, data, args, function () {
                                            $("#userkey-" + common.escapeSelector(key)).remove();
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

        $(".useredit-saveItemBtn").each(function () {
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
            var confirm = btn.element.dataset.confirm;
            var inp = $("#userinp-" + common.escapeSelector(key));

            var generalAction = function () {
                var value = btn.element.dataset.attributekey;
                actions.updateDBKey(userid, value, inp.val());
            };

            var InplaceAction = function () {
                inp.data("resetVal", inp.val());
                inp.trigger("inputReset");
                btn.disable();
            };
            var confirmAction = function () {

            };

            var reloadAction = function () {
                window.reload();
            };

            btn.addAction("click", action);

            var el = inp;
            el.on("input", function () {
                btn.enable();
            });
            el.on("inputReset", function () {
                btn.disable();
            });
            lidlRTO.objectManager.addObject(btn, token);
        });

        $(".useredit-resetItemBtn").each(function () {
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
            btn.addAction("click", function () {
                var inp = $("#userinp-" + common.escapeSelector(key));
                inp.val(btn.element.dataset.attributeval);
                inp.trigger("inputReset");
                btn.disable();

            });
            var inp = $("#userinp-" + common.escapeSelector(key));
            inp.data("resetVal", inp.val());
            inp.on("input", function () {
                btn.enable();
            });
            inp.on("inputReset", function (e) {
                var inp = $(e.target);
                inp.val(inp.data("resetVal"));
                btn.disable();
            });
            lidlRTO.objectManager.addObject(btn, token);
        });

        /*
        special fields
         */

        $(".username-change").off("click").on("click", function (e) {
            e.preventDefault();
            var self = this;
            addDBKey_sidebar.addContent('UserChangeUsername', {
                    userid: userid,
                    key: "username",
                    value: self.dataset.value,
                    callback: {
                        onConfirm: function (userid, key, value) {
                            var args = {
                                //isArray: false
                            };
                            const changeContent = {
                                title: "unisams-Nutzername ändern",
                                message: "Achtung: Anmeldung zum Unisams-System ist danach nur noch mit dem neuen Nutzernamen möglich.",
                                titleArg: "",
                                messageArg: ""
                            };
                            var changeArgs = {
                                userid: userid,
                                callback: {
                                    onConfirm: function () {
                                        actions.updateDBKey(userid, key, value, args, function () {
                                            location.replace("/unisams/user/" + userid + "/editUser");
                                        });
                                    }
                                }
                            };
                            token = lidlRTO.objectManager.createNewObjectToken();
                            const dialogChangeUsername = new lidl.Dialog(token2, null, 'confirmChange', changeContent, changeArgs);
                            lidlRTO.objectManager.addObject(dialogChangeUsername, token);
                            dialogChangeUsername.openDialog();
                        },
                        onDelete: function (userid, value) {
                            var key = "qualifications";
                            var args = {
                                //isArray: true
                            };

                            const dialog_content = {
                                title: "Eintrag löschen",
                                message: "Folgender Eintrag wird gelöscht: " + value.title,
                                titleArg: "",
                                messageArg: ""
                            };
                            var dialog_token = lidlRTO.objectManager.createNewObjectToken();
                            const dialog_args = {
                                userid: userid,
                                callback: {
                                    onConfirm: function (res) {
                                        actions.removeDBKey(userid, key, value, args, function () {
                                            $("#userkey" + common.escapeSelector(key)).remove();
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

    }


});