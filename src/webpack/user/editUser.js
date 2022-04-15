import {
    Uppload,
    Local,
    Camera,
    URL,
    xhrUploader,
    Crop,
    en,

} from "uppload";

import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";

import {userActions} from "../actions/userActions";

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

$(document).ready (function () {

    var lidlRTO = window.lidlRTO;
    var common = window.common;
    var actions = window.actions;

    var currentExploredUser;
    var profile = new window.profile.Profile(window.exploreUserId);

    // create new observer
    var observer = new lidlObserver(function(user){
        currentExploredUser = user;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    profile.getUserAndSubscribe(observer)
        .then(function(user){
            buildPage(user)
        })
        .catch(function(reason){
            console.error("Failed to retrieve user data:" + reason)
        });



    function buildPage(user) {
        // window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("userEdit", user, {});
        currentExploredUser = user;
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
        const dialogDeleteUser = new lidlDialog(token, ".userDelete", 'confirmDelete', deleteContent, deleteArgs);
        lidlRTO.objectManager.addObject(dialogDeleteUser, token);

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
        const dialog03 = new lidlDialog(token3, ".useredit-removeItemBtn", 'removeDBKey', content3, args03);
        lidlRTO.objectManager.addObject(dialog03, token3);

        const uploader = new Uppload({
            lang: en,
            call: ".changeProfilePicture",
            defaultService: "local",
            uploader: xhrUploader({
                endpoint: '/api/v1/usermod/' + userid + "/uploadUserImage",
                fileKeyName: "image",
                method: "POST"
            })
        });
        uploader.use([new Local(), new Camera(), new URL()]);
        uploader.use([
            new Crop({
                aspectRatio: 1
            }),
        ]);
        uploader.on("upload", function(){
            const items = $(".userProfileImage");
            let src;
            $(items).each(function (img) {
                src = $(this).attr("src");
                $(this).attr("src", src + "?t=" + new Date().getTime());
            });
        });


        // var addDBKey_sidebar = new common.Sidebar('wrapper', {title: "Test"});
        let addDBKey_sidebar = new Sidebar('wrapper', "test");
        addDBKey_sidebar.addPlugin(userPlugin);

        let listContainer = document.getElementById("qualification-list")
        if(listContainer) {
            let listElem = new common.ScrollableList(listContainer, "qualification", user.qualifications, {}, {
                listItem: {
                    onClick: function(e){
                        e.preventDefault();
                        var self = e.currentTarget;
                        addDBKey_sidebar.addContent('UserUpdateQualification', {
                                userid: userid,
                                key: self.dataset.key,
                                keyId: self.dataset.keyid,
                                qualificationId: self.dataset.keyid,
                                callback: {
                                    onConfirm: function (userid, key, value) {
                                        var args = {
                                            isArray: true, //we reference the element directly by array index
                                            noIndex: false,
                                            keyId: self.dataset.keyId
                                        };
                                        actions.updateQualification(userid, key, value, args, function () {

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
                                                    actions.removeQualification(userid, key, data, args, function () {
                                                        $("#qualId" + common.escapeSelector(data.id)).remove();
                                                    });
                                                    lidlRTO.objectManager.removeObject(dialog_token);
                                                    addDBKey_sidebar.hide()
                                                }
                                            }
                                        };
                                        const dialog = new lidlDialog(dialog_token, null, 'removeDBKey', dialog_content, dialog_args);
                                        lidlRTO.objectManager.addObject(dialog, dialog_token);
                                        dialog.openDialog();
                                    }
                                },
                            },
                        );
                        addDBKey_sidebar.show();
                    }
                }
            });
        }

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

                            };
                            actions.addQualification(userid, key, value, args, function () {

                            });
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
                            actions.updateDBKey(userid, key, value, args, function (response) {
                                let user = response.result;
                                addDBKey_sidebar.hide();
                                $(e.currentTarget).find(".userkey-entry-value").html(value.value);
                                $(e.currentTarget).find(".userkey-entry-title").html(value.title);
                                e.currentTarget.dataset.value = value.value;
                                e.currentTarget.dataset.title = value.title;
                                //if name was changed, change heading accordingly
                                if(key === "generalData.firstName" || key === "generalData.lastName") document.getElementById("userProfileName").innerHTML = user.generalData.firstName.value + " " + user.generalData.lastName.value;
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
                            const dialog = new lidlDialog(dialog_token, null, 'removeDBKey', dialog_content, dialog_args);
                            lidlRTO.objectManager.addObject(dialog, dialog_token);
                            dialog.openDialog();
                        }
                    },
                },
            );
            addDBKey_sidebar.show();
        });


        $(".usercontact-entry").on("click", function (e) {
            e.preventDefault();
            var self = this;
            var keyId = self.dataset.keyid;
            var key = self.dataset.key;


            var field = common.refJSON(currentExploredUser, key);

            addDBKey_sidebar.addContent('UserUpdateContactKey', {
                    userid: userid,
                    key: key,
                    catKey: self.dataset.catkey,
                    field: field,
                    user: currentExploredUser,
                    type: field.type,
                    default: field.default,
                    callback: {
                        onConfirm: function (userid, key, value, args) {
                            profile.updateDBKey(key, value, args, function () {
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
                            const dialog = new lidlDialog(dialog_token, null, 'removeDBKey', dialog_content, dialog_args);
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
                                            location.replace("/unisams/user/edit/" + userid);
                                        });
                                    }
                                }
                            };
                            token = lidlRTO.objectManager.createNewObjectToken();
                            const dialogChangeUsername = new lidlDialog(token, null, 'confirmChange', changeContent, changeArgs);
                            lidlRTO.objectManager.addObject(dialogChangeUsername, token);
                            dialogChangeUsername.openDialog();
                        },
                    },
                },
            );
            addDBKey_sidebar.show();
        });

        $(".userrole-change").off("click").on("click", function (e) {
            e.preventDefault();
            var self = this;
            addDBKey_sidebar.addContent('UserChangeRole', {
                    userid: userid,
                    key: "userRole",
                    callback: {
                        onConfirm: function (data, args) {
                            userActions.setRole(data, args);
                        },
                    },
                },
            );
            addDBKey_sidebar.show();
        });

    }


});