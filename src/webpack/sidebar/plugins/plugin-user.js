import SidebarPlugin from "../SidebarPlugin"
import ContentHandler from "../ContentHandler";


import "../sidebar-user.scss";

const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";
import {getDataFromServer, stringToBoolean} from "../../helpers/helpers";
import {MDCTextField} from "@material/textfield";
import {MDCTextFieldHelperText} from "@material/textfield/helper-text";

let userPlugin = new SidebarPlugin("user");

let showUser = new ContentHandler("user",
    function(sidebar, args, type) {
        let userid = args.userid;
        getDataFromServer("/api/v1/usermod/"+userid,function(context){
            $.get('/webpack/sidebar/templates/sidebar-user.hbs', function (data) {
                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(".sidebar-back-btn");
            });
        })
    });
let addUser = new ContentHandler("addUser", 
    function(sidebar, args, type) {
        let context = {};
        let onConfirm = args.callback.onConfirm;
        $.get('/webpack/sidebar/templates/sidebar-addUser.hbs', function (data) {
            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        let generalData = {
                            firstName: $("#addUserForm-firstName").val(),
                            lastName: $("#addUserForm-lastName").val(),
                        };
                        let memberId = {
                            setCustom: false,
                        };
                        onConfirm($("#addUserForm-username").val(), $("#addUserForm-password").val(), generalData, memberId);
                    }.bind(args)
                });
        });
    });

let changeUsername = new ContentHandler("UserChangeUsername",
    function(sidebar, args, type) {
        let userId = args.userid;
        let key = args.key;
        let value = args.value;
        let onConfirm = args.callback.onConfirm;
        let corrupted = false;

        let res = {};

        getDataFromServer("/api/v1/usermod/"+ userId,function(context){
            res.exploreUser = context;
            action(res)
        });

        let action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-updateUsername.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                sidebar.registerBackButton( ".sidebar-back-btn");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            data = {
                                value: document.getElementById("userkey-value").value
                            };
                            onConfirm(args.userid, key, data.value);
                        }.bind(args)
                    });

            });
        };
    });

let addDbKey = new ContentHandler("UseraddDBKey",
    function(sidebar, args, type) {

        let userId = args.userid;
        let onConfirm = args.callback.onConfirm;
        let opt = false;

        let res = {dataset: {}};

        getDataFromServer("/api/v1/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/api/v1/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        let action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-addUserKey.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                let catKey = "";
                let key = "";

                sidebar.registerBackButton( ".sidebar-back-btn");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            let r = document.getElementById("userkey-key");
                            let key = catKey + "." + r.value;
                            let funcArgs = {
                                isArray: r.options[r.selectedIndex].dataset.isarray
                            };
                            let val = {
                                value: document.getElementById("userkey-value").value,
                                title: "TestTitle2",
                            };
                            onConfirm(userId, key, val, funcArgs);
                        }.bind(args)
                    });
                let q = document.getElementById("userkey-category");
                let doc = res.dataset.user.categories;
                q.addEventListener("change", function(e){
                    populateUserKeys(sidebar, doc, q.options[q.selectedIndex].dataset.datasetid, {
                        createNewEntry: true,
                    });
                    catKey = q.options[q.selectedIndex].value;
                });
                // Apply onchange function initially
                let event = new Event('change');
                q.dispatchEvent(event);
            });
        };

    });

let addContactData= new ContentHandler("UserAddContactDataKey",
    function(sidebar, args, type) {
        let userId = args.userid;
        let onConfirm = args.callback.onConfirm;
        let onDelete = args.callback.onDelete;
        let catKey = args.catKey;
        let opt = false;

        let res = {dataset: {}};

        getDataFromServer("/api/v1/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/api/v1/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        let action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-addContactDataKey.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                let r = document.getElementById("userkey-key");
                let q = document.getElementById("userkey-category");
                let v = document.getElementById("userkey-value");

                sidebar.registerBackButton( ".sidebar-back-btn");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            let key = catKey;
                            let type = r.value;
                            let title = r.options[r.selectedIndex].dataset.title;

                            let funcArgs = {
                                isArray: stringToBoolean(r.options[r.selectedIndex].dataset.isarray),
                                noIndex: true
                            };
                            let val = {
                                value: v.value,
                                title: r.options[r.selectedIndex].dataset.title,
                                type: type
                            };
                            if (sidebar.currentState.customEntryActive) {
                                val = {
                                    value: v.value,
                                    title: document.getElementById("custom-type").value,
                                    type: type
                                };
                            }
                            onConfirm(userId, key, val, funcArgs);
                        }.bind(args)
                    });

                let doc = res.dataset.user.categories;

                // set current category
                setCurrentUserKey(q,catKey);
                // populate
                populateUserKeys(sidebar, doc, q.options[q.selectedIndex].dataset.datasetid, {
                    createNewEntry: {
                        enabled: true,
                        callback: {
                            onEnabled: function() {
                                sidebar.currentState.customEntryActive = true;
                            },
                            onDisabled: function() {
                                sidebar.currentState.customEntryActive = false;
                            },
                        }
                    },
                    val: ""
                });
            });
        };
    });

let addGeneralKey = new ContentHandler("UserAddGeneralDataKey",
    function(sidebar, args, type) {
        let userId = args.userid;
        let onConfirm = args.callback.onConfirm;
        let opt = false;

        let res = {dataset: {}};

        getDataFromServer("/api/v1/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/api/v1/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        let action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-addGeneralDataKey.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                let catKey = args.catKey;
                let key = "";

                let r = document.getElementById("userkey-key");
                let q = document.getElementById("userkey-category");
                let v = document.getElementById("userkey-value");
                let doc = res.dataset.user.categories;
                sidebar.registerBackButton( ".sidebar-back-btn");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            let key = catKey + "." + r.value;
                            let funcArgs = {
                                isArray: stringToBoolean(r.options[r.selectedIndex].dataset.isarray),
                                noIndex: true
                            };
                            let val = {
                                value: v.value,
                                title: r.options[r.selectedIndex].dataset.title
                            };
                            if (sidebar.currentState.customEntryActive) {
                                val = {
                                    value: v.value,
                                    title: document.getElementById("custom-type").value,
                                    type: "customData",
                                };
                            }


                            onConfirm(userId, key, val, funcArgs);
                        }.bind(args)
                    });
                // set current category
                setCurrentUserKey(q,catKey);
                // populate
                populateUserKeys(sidebar, doc, q.options[q.selectedIndex].dataset.datasetid, {
                    createNewEntry: {
                        enabled: true,
                        callback: {
                            onEnabled: function() {
                                sidebar.currentState.customEntryActive = true;
                            },
                            onDisabled: function() {
                                sidebar.currentState.customEntryActive = false;
                            },
                        }
                    },
                    val: ""
                });

                if (catKey === undefined) {
                    catKey = q.options[q.selectedIndex].value;
                }

                r.addEventListener("change", function(e){
                    let tmpKey = catKey + "." + r.value;
                    let val = sidebar.findExistingValues(context.exploreUser,tmpKey);
                    if (val !== undefined) {
                        v.value = val.value;
                        v.html = val.value;
                    }
                    else {
                        v.value = "";
                        v.html = "";
                    }
                });

            });
        };
    });

let updateDbKey = new ContentHandler("UserUpdateDBKey",
    function(sidebar, args, type) {
        let userId = args.userid;
        let keyId = args.keyId;
        let key = args.key;
        let catKey = args.catKey;
        let subKey = args.subKey;
        let value = args.value;
        let isCustomEntry = args.isCustomEntry;
        let isRemoveable = args.isRemoveable;
        let onConfirm = args.callback.onConfirm;
        let onDelete = args.callback.onDelete;

        let res = {dataset: {}};
        let corrupted = false;

        let ctype = (isCustomEntry) ? args.type : undefined;

        getDataFromServer("/api/v1/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/api/v1/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        let action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-updateUserKey.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                let q = document.getElementById("userkey-category");
                let r = document.getElementById("userkey-key");
                let v = document.getElementById("userkey-value");
                let doc = res.dataset.user.categories;

                sidebar.registerBackButton( ".sidebar-back-btn");
                sidebar.registerCancelButton(".sidebar-cancel");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            let funcArgs = {
                                isArray: stringToBoolean(r.options[r.selectedIndex].dataset.isarray),
                                noIndex: true
                            };
                            let val = {
                                id: keyId,
                                value: v.value,
                                title: r.options[r.selectedIndex].dataset.title,
                            };
                            if (sidebar.currentState.customEntryActive) {
                                val = {
                                    id: keyId,
                                    value: v.value,
                                    title: document.getElementById("custom-type").value,
                                };
                            }
                            onConfirm(args.userid, key, val);
                        }.bind(args)
                    });

                sidebar.registerButton (".sidebar-delete",
                    {
                        customHandler: true,
                        handler: function () {
                            // delete array entry
                            data = {
                                title: key
                            };
                            if (corrupted) {
                            }
                            onDelete(args.userid, key, data);
                        },
                        enabled: isRemoveable,
                    });

                q.addEventListener("change", function(e){
                    populateUserKeys(sidebar, doc, q.options[q.selectedIndex].dataset.datasetid, {
                        createNewEntry: {
                            enabled: true,
                            callback: {
                                onEnabled: function() {
                                    sidebar.currentState.customEntryActive = true;
                                },
                                onDisabled: function() {
                                    sidebar.currentState.customEntryActive = false;
                                },
                            }
                        },
                        filter: {
                            value: subKey
                        },
                        isCustomEntry: isCustomEntry,
                        findExistingEntries: {
                            doc: context.exploreUser,
                            key: key,
                        },
                        value: value,
                    });
                    catKey = q.options[q.selectedIndex].value;
                });
                // set current category
                setCurrentUserKey(q,catKey);
                // Apply onchange function initially
                let event = new Event('change');
                q.dispatchEvent(event);
            });
        };
    });

let updateContactKey = new ContentHandler("UserUpdateContactKey",
    function(sidebar, args, type) {
        let userId = args.userid;
        let key = args.key;
        let catKey = args.catKey;
        let field = args.field;
        let ctype = args.type;
        let isDefault = args.default;
        let onConfirm = args.callback.onConfirm;
        let onDelete = args.callback.onDelete;

        let res = {dataset: {}};
        res.exploreUser = args.user;
        res.contactEntry = field;
        let corrupted = false;

        let isCustomEntry = false;
        let filterValue = field.title;
        if (ctype === "customData") {
            isCustomEntry = true;
            filterValue = "customData";
        }

        getDataFromServer("/api/v1/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            action(res);
        });

        let action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-updateContactDataKey.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                let r = document.getElementById("userkey-key");
                let q = document.getElementById("userkey-category");
                let v = document.getElementById("userkey-value");
                let def = document.getElementById("default-checkbox");

                sidebar.registerBackButton( ".sidebar-back-btn");
                sidebar.registerCancelButton(".sidebar-cancel")
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            let key = catKey;
                            let ctype = r.value;
                            let title = r.options[r.selectedIndex].dataset.title;

                            let funcArgs = {
                                isArray: true,
                                noIndex: true,
                            };
                            let val = {
                                value: v.value,
                                id: field._id,
                                title: r.options[r.selectedIndex].dataset.title,
                                type: ctype,
                                default: def.checked,
                            };
                            if (sidebar.currentState.customEntryActive) {
                                val.title = document.getElementById("custom-type").value;
                            }
                            onConfirm(args.userid, key, val, funcArgs);
                        }.bind(args)
                    });

                sidebar.registerButton ( ".sidebar-delete",
                    {
                        customHandler: true,
                        handler: function () {
                            // delete array entry
                            data = {
                                title: key
                            };
                            if (corrupted) {
                            }
                            onDelete(args.userid, key, data);
                        }
                    });

                let [status, msg] = checkDataValidity(field, {value: "string", title: "string", type: "string"});
                if(status !== 0){
                    corrupted=true;
                    console.warn("trying to read corrupted data");
                    sidebar.addErrorMessage("trying to read corrupted data!\n" + msg,  function(data){
                        $("#sidebar-inner").before(data);
                    });
                }

                let doc = res.dataset.user.categories;
                q.addEventListener("change", function(e){
                    populateUserKeys(sidebar, doc, q.options[q.selectedIndex].dataset.datasetid, {
                        createNewEntry: {
                            enabled: true,
                            callback: {
                                onEnabled: function () {
                                    sidebar.currentState.customEntryActive = true;
                                },
                                onDisabled: function () {
                                    sidebar.currentState.customEntryActive = false;
                                },
                            },
                        },
                        filter: {
                            key: "data-title",
                            value: filterValue,
                        },
                        isCustomEntry: isCustomEntry,
                        findExistingEntries: {
                            doc: context.exploreUser,
                            key: key,
                        },
                        value: field.value,
                    });
                });
                // set current category
                setCurrentUserKey(q,catKey);
                // Apply onchange function initially
                let event = new Event('change');
                q.dispatchEvent(event);
            });
        };
    });

let viewDbKey = new ContentHandler("UserViewDBKey",
    function(sidebar, args, type) {
        let userId = args.userid;
        let keyId = args.keyId;
        let key = args.key;
        let catKey = args.catKey;
        let subKey = args.subKey;
        let value = args.value;

        let res = {dataset: {}};
        let corrupted = false;

        getDataFromServer("/api/v1/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/api/v1/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        let action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-viewUserKey.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                sidebar.registerBackButton( ".sidebar-back-btn");
                let q = document.getElementById("userkey-category");
                let r = document.getElementById("userkey-key");
                let v = document.getElementById("userkey-value");
                let doc = res.dataset.user.categories;
                // set current category
                setCurrentUserKey(q,catKey);
                // Apply onchange function initially
                populateUserKeys(sidebar, doc, q.options[q.selectedIndex].dataset.datasetid, {
                    filter: {
                        value: subKey
                    },
                    html: value,
                    disabled: false,
                });
                // disable inputs
                disableViewBox([q,r]);
            });
        };
    });
let addQualification = new ContentHandler("UserAddQualification",
    function(sidebar, args, type) {
        let userId = args.userid;
        let catKey = args.catKey;
        let onConfirm = args.callback.onConfirm;

        let res = {qualifications: {}};

        let userData = new Promise(function(resolve, reject){
            getDataFromServer("/api/v1/usermod/"+userId,function(context){
                resolve(context);
            });
        });

        let qualificationData = new Promise(function(resolve, reject) {
            getDataFromServer("/api/v1/qualification/groupByType", function (context) {
                resolve(context);
            });
        })

        Promise.all([userData, qualificationData])
            .then(function(values){
                let exploreUser = values[0];
                let byTypeArray = values[1];
                res.exploreUser = exploreUser;
                res.qualifications.byType = byTypeArray
                action(res);
            })
        let action = function(context){
            $.get('/webpack/sidebar/templates/sidebar-addUserQualification.hbs', function (data) {
                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(".sidebar-back-btn");
                sidebar.registerCancelButton(".sidebar-cancel")
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            const id = document.getElementById("qual-name").selectedOptions[0].id;
                            let key = catKey;
                            data = {
                                qualification: findQualByIdInTypeArray(res.qualifications.byType, id)._id,
                                acquiredDate: $("#qual-acquiredDate").val(),
                                expireDate: $("#qual-expireDate").val(),
                                trainingDate: $("#qual-trainingDate").val(),
                            };
                            onConfirm(args.userid, key, data);
                        }.bind(args)
                    });
                let q = $("#qual-type");
                q.on("change",function(e){
                    let typeData = res.qualifications.byType.find(element => element._id === e.target.value);
                    let qualNameObject = document.getElementById("qual-name");
                    // remove existing options
                    qualNameObject.options.length = 0;
                    //add available options for selected type
                    typeData.values.forEach(function (el, index){
                        const option = document.createElement('option');
                        option.id = el._id;
                        option.value = el.name;
                        option.innerHTML = el.name;
                        qualNameObject.options[index] = option;
                    });


                })
            });
        };
    });
let viewQualification = new ContentHandler("UserViewQualification",
    function(sidebar, args, type) {
        let userId = args.userid;
        let qualId = args.qualificationId;

        let res = {qualifications: {}};

        let corrupted = false;

        getDataFromServer("/api/v1/usermod/"+userId,function(context){
            res.exploreUser = context;
            res.currentQualification = context.qualifications.find(qual => qual._id === qualId);
            action(res)
        });

        let action = function(context){
            $.get('/webpack/sidebar/templates/sidebar-viewUserQualification.hbs', function (data) {
                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(".sidebar-back-btn");

                if(!populateCurrentQualificationDefault(sidebar, res.qualifications.byType, res.currentQualification.qualification)){
                    console.warn("trying to read corrupted data");
                    sidebar.addErrorMessage("trying to read corrupted data!",  function(data){
                        $("#sidebar-inner").before(data);
                    });
                    $("#qual-type").addClass("viewBox-disabled");
                    $("#qual-name").addClass("viewBox-disabled");
                    $("#qual-aquiredDate").addClass("viewBox-disabled");
                    $("#qual-expireDate").addClass("viewBox-disabled");
                    $("#qual-trainingDate").addClass("viewBox-disabled");
                    corrupted = true;

                }
            });
        };
    });
let updateQualification = new ContentHandler("UserUpdateQualification",
    function(sidebar, args, type) {
        let userId = args.userid;
        let key = args.key;
        let keyId = args.keyId;
        let qualId = args.qualificationId;
        let onConfirm = args.callback.onConfirm;
        let onDelete = args.callback.onDelete;

        let res = {qualifications: {}};

        let corrupted = false;

        let userData = new Promise(function(resolve, reject){
            getDataFromServer("/api/v1/usermod/"+userId,function(context){
                resolve(context);
            });
        });

        let qualificationData = new Promise(function(resolve, reject) {
            getDataFromServer("/api/v1/qualification/groupByType", function (context) {
                resolve(context);
            });
        })

        Promise.all([userData, qualificationData])
            .then(function(values){
                let exploreUser = values[0];
                let byTypeArray = values[1];
                res.exploreUser = exploreUser;
                res.qualifications.byType = byTypeArray
                res.currentQualification = exploreUser.qualifications.find(qual => qual._id === qualId);
                action(res);
            })

        let action = function(context){
            $.get('/webpack/sidebar/templates/sidebar-updateUserQualification.hbs', function (data) {
                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(".sidebar-back-btn");
                sidebar.registerCancelButton(".sidebar-cancel");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {

                            //helper to find qualification document in groupByType array
                            const id = document.getElementById("qual-name").selectedOptions[0].id;
                            data = {
                                id: keyId,
                                qualification: sidebar.findQualByIdInTypeArray(res.qualifications.byType, id)._id,
                                acquiredDate: $("#qual-acquiredDate").val(),
                                expireDate: $("#qual-expireDate").val(),
                                trainingDate: $("#qual-trainingDate").val(),
                            };
                            onConfirm(args.userid, key, data);
                        }.bind(args)
                    });

                sidebar.registerButton (".sidebar-delete",
                    {
                        customHandler: true,
                        handler: function () {

                            // delete array entry
                            data = {
                                id: keyId,
                                qualification: res.currentQualification.qualification,
                            };
                            if (corrupted) {
                                data.qualification = {qualType: "error", name: "error"}
                            }
                            onDelete(args.userid, key, data);
                        }
                    });

                if(!sidebar.populateCurrentQualificationDefault(sidebar, res.qualifications.byType, res.currentQualification.qualification)){
                    console.warn("trying to read corrupted data");
                    sidebar.addErrorMessage("trying to read corrupted data!",  function(data){
                        $("#sidebar-inner").before(data);
                    });

                    $("#qual-type").addClass("select-disabled");
                    $("#qual-name").addClass("select-disabled");

                    $(".sidebar-confirm").addClass("btn-disabled");

                    corrupted = true;

                }
                // listener to update names if type changes
                let q = document.getElementById("qual-type");
                $(q).on("change",function(e){
                    let typeData = res.qualifications.byType.find(element => element._id === e.target.value);
                    let qualNameObject = document.getElementById("qual-name");
                    // remove existing options
                    qualNameObject.options.length = 0;
                    //add available options for selected type
                    typeData.values.forEach(function (el, index){
                        const option = document.createElement('option');
                        option.id = el._id;
                        option.value = el.name;
                        option.innerHTML = el.name;
                        option.selected = "";
                        qualNameObject.options[index] = option;
                    });
                });

            });
        };
    });

let changeRole = new ContentHandler("UserChangeRole",
    function(sidebar, args, type) {
        let userId = args.userid;
        let key = args.key;
        let onConfirm = args.callback.onConfirm;
        let corrupted = false;

        let res = {};

        getDataFromServer("/api/v1/acl/"+ userId,function(context){
            res.acl = context;
            action(res)
        });

        let action = function(context) {
            $.get('/webpack/sidebar/templates/user/sidebar-updateUserRole.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                $("#changeUserRole-select").val(context.acl.userRole);

                sidebar.registerBackButton( ".sidebar-back-btn");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            data = {
                                userId: userId,
                                role: $("#changeUserRole-select").val(),
                            };
                            onConfirm(data);
                        }.bind(args)
                    });
            });
        };
    });
let changeUserPassword = new ContentHandler("UserChangePassword",
    function(sidebar, args, type, contentHandler) {
        let userId = args.userid;
        let onConfirm = args.callback.onConfirm;
        let requireCurrentPassword = args.requireCurrentPassword;
        let defaultTitle = "Passwort ändern";
        let corrupted = false;

        let res = {};

        getDataFromServer("/api/v1/usermod/"+ userId,function(context){
            res.exploreUser = context;
            action(res)
        });

        let action = function(context) {

            context.sidebarTitle = args.sidebarTitle ?? defaultTitle;

            $.get('/webpack/sidebar/templates/user/sidebar-updateUserPassword.hbs', function (data) {

                let template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                const currentPwField = new MDCTextField(document.querySelector('#passwordCurrent'));
                const pwField = new MDCTextField(document.querySelector('#password'));
                const pwCheck = new MDCTextField(document.querySelector('#passwordCheck'));
                const pwCheckHelper = new MDCTextFieldHelperText(document.querySelector('#passwordCheck-helper'));

                if(!requireCurrentPassword) {
                    currentPwField.disabled = true;
                }

                let customValidator = function(current, pw1, pw2){
                    /*
                    resons:
                        1 - pwds do not match
                        2 - pwcheck empty
                        2 - regex not passed
                     */
                    let result = {state: true, reason: 0}
                    //entered pwds must match
                    if (pw1 !== pw2) {
                        result = {state: false, reason: 1}
                    }
                    if (pwCheck.value.length === 0) result = {state: false, reason: 2}
                    //pw must have 8 characters and min 1 number
                    let pwReg = new RegExp("^(((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})");
                    if (!pwReg.test(pw1))  result = {state: false, reason: 3};

                    //new password must not match the current one
                    if(requireCurrentPassword && pw1 === current) result = {state: false, reason: 4};

                    return result;
                };
                let customValidatorCallback = {
                    onSuccess: function(){
                        data = {
                            pw: pwField.value,
                            check: pwCheck.value,
                        };
                        if(requireCurrentPassword) data.current = currentPwField.value;
                        onConfirm(args.userid, data);
                    },
                    onFailure: function(reason){
                        switch(reason){
                            case 1:
                                pwCheck.helperTextContent = "Passwörter stimmen nicht überein";
                                pwCheck.valid = false;
                                break;
                            case 2:
                                pwCheck.helperTextContent = "Passwort wiederholen";
                                pwCheck.valid = false;
                                break;
                            case 3:
                                pwField.helperTextContent = "Mindestens 8 Zeichen, davon mind. 1 Zahl und 1 Buchstabe";
                                pwCheck.helperTextContent = "Passwort wiederholen";
                                pwField.valid = false;
                                pwCheck.valid = false;
                                break;
                            case 4:
                                pwField.helperTextContent = "Das neue Passwort darf nicht dem Aktuellen entsprechen.";
                                pwCheck.helperTextContent = "Passwort wiederholen";
                                pwField.valid = false;
                                pwCheck.valid = false;
                                break;
                            default:
                                pwCheck.helperTextContent = "failed. Error" + reason;
                                pwCheck.valid = false;
                                break;
                        }
                    }
                };

                contentHandler.removeCustomValidators();
                contentHandler.addCustomValidator(function(){
                    return customValidator(currentPwField.value, pwField.value, pwCheck.value)},
                    customValidatorCallback
                )

                sidebar.registerBackButton( ".sidebar-back-btn");
                let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            //check
                            contentHandler.validate();
                        }.bind(args)
                    });

            });
        };
    });

let changeInternalEmail = new ContentHandler("UserSetInternalEmail",
    function(sidebar, args, type) {
        let onConfirm = args.callback.onConfirm;
        let corrupted = false;

        let context = {
            current: args.data.current,
            username: args.data.username,
        };

        $.get('/webpack/sidebar/templates/user/sidebar-updateInternalMail.hbs', function (data) {

            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));

            sidebar.registerBackButton( ".sidebar-back-btn");
            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        data = {
                            value: document.getElementById("userkey-value").value
                        };
                        onConfirm(data.value);
                    }.bind(args)
                });

        });
    });

userPlugin.addContentHandler(showUser);
userPlugin.addContentHandler(addUser);
userPlugin.addContentHandler(changeUsername);
userPlugin.addContentHandler(changeRole);
userPlugin.addContentHandler(addDbKey);
userPlugin.addContentHandler(addContactData);
userPlugin.addContentHandler(addGeneralKey);
userPlugin.addContentHandler(updateDbKey);
userPlugin.addContentHandler(updateContactKey);
userPlugin.addContentHandler(viewDbKey);
userPlugin.addContentHandler(addQualification);
userPlugin.addContentHandler(viewQualification);
userPlugin.addContentHandler(updateQualification);
userPlugin.addContentHandler(changeUserPassword);
userPlugin.addContentHandler(changeInternalEmail);

//TODO: make Sidebar a singleton and add static function to access runtime object


/**
 * user data operations
 *
 */

let populateUserKeys = function(sidebar, doc, compareValue, args){
    if (args === undefined) args = {};

    //find selected category
    let current = doc.find(element => element._id === compareValue);
    getDataFromServer("/api/v1/dataset/user/getChildren/" + current._id, function (context) {
        let userkeyObject = document.getElementById("userkey-key");
        let uservalueObject = document.getElementById("userkey-value");
        let customTypeObject = document.getElementById("custom-type");
        // remove existing options
        userkeyObject.options.length = 0;
        //add available options for selected type
        context.forEach(function (el, index) {
            const option = document.createElement('option');
            option.id = el._id;
            option.value = el.key;
            option.dataset.title = el.title;
            option.dataset.type = el.key;
            option.innerHTML = el.title;
            option.dataset.isarray = el.isArray;
            userkeyObject.options[index] = option;
        });
        if (args.createNewEntry) {
            let data = args.createNewEntry;
            if (typeof(data)!=='object') {
                data = {};
                data.enabled = true;
                data.callback = {
                    onEnabled: function(){},
                    onDisabled: function(){}
                }
            }
            if (data.enabled) {
                // create delimiter
                const delimiter = sidebar.createSelectDelimiter();
                userkeyObject.add(delimiter);

                // add option to create new key
                const option = document.createElement('option');
                option.value = "customData";
                option.dataset.title = "customData";
                option.dataset.type = "customData";
                option.innerHTML = "Neu anlegen...";
                option.dataset.isarray = "true";
                userkeyObject.add(option);

                //detect if this selected
                userkeyObject.addEventListener("change", function (e) {
                    if (this.value === "customData") {
                        sidebar.enableOptional(".ak-customType");
                        data.callback.onEnabled();
                    } else {
                        sidebar.disableOptional(".ak-customType");
                        data.callback.onDisabled();
                    }
                });
                // fire "change" event once to catch case where no other options is present
                let event = new Event('change');
                userkeyObject.dispatchEvent(event);
            }
        }

        if (args.findExistingEntries) {
            let data = args.findExistingEntries;
            let val = sidebar.findExistingValues(data.doc, data.key);
            if (val !== undefined) {
                if (args.isCustomEntry) {
                    customTypeObject.value = val.title;
                    customTypeObject.innerHTML = val.title;

                }
                uservalueObject.value = val.value;
                uservalueObject.innerHTML = val.value;
            }
            // handle custom entries

        }
        if (args.filter) {
            let filter = args.filter;
            if (!filter.key) filter.key = "value";
            if (!filter.value) {
                console.error("Missing required field: filter.value.");
                return;
            }
            $(userkeyObject).children('option').filter(function (i, e) {
                return e.getAttribute(filter.key) === filter.value;
            }).attr('selected', true);
            userkeyObject.dispatchEvent(new Event("change"));
        }

        if (args.value) {
            uservalueObject.value = args.value;
        }
        if (args.html) {
            uservalueObject.innerHTML = args.html; // clear existing
        }
    });
};

let setCurrentUserKey = function(selectElement, key){
    $(selectElement).children('option').filter(function (i, e) {
        return e.value === key
    }).attr('selected', true);
};



/*
helpers for the updating operations
 */

let findQualByIdInTypeArray = function(byTypeArr, qualId){
    let localmatch;
    byTypeArr.forEach(function(qual){
        let match = qual.values.find(qualEntry => qualEntry._id === qualId);
        if (match != null) {
            localmatch = match;
        }
    });
    return localmatch;
};

let populateCurrentQualificationDefault = function(sidebar, doc, current, args){
    if (args === undefined) args = {};

    // check if data are valid
    if (!sidebar.checkQualificationDataValidity(current)){
        return false;
    }
    else {
        let typeData = doc.find(element => element._id === current.qualType);
        let qualNameObject = document.getElementById("qual-name");
        let q = document.getElementById("qual-type");
        // select current as default
        $(q).children('option').filter(function (i, e) {
            return e.text === current.qualType
        }).attr('selected', true);
        //add available options for selected type, with current selected as default
        typeData.values.forEach(function (el, index) {
            const option = document.createElement('option');
            option.id = el._id;
            option.value = el.name;
            option.innerHTML = el.name;
            option.selected = (el.name === current.name);
            qualNameObject.options[index] = option;
        });
        if (args.addCreateEntry) {
            let delimiter = sidebar.createSelectDelimiter();
            qualNameObject.append(delimiter);

            let createEntry = document.createElement('option');
            createEntry.innerHTML = "Neu anlegen...";
            createEntry.value = "enableOptional_custom-name";
            createEntry.classList.add("option-createNewEntry");
            qualNameObject.append(createEntry);
        }
    }
    return true;
};


/**
 *
 * @param field
 * @param dataset
 * @returns {Object}
 */
let checkDataValidity = function(field, dataset){
    let errorList = [];
    let status = 0;
    for (let [key, value] of Object.entries(dataset)){
        if(typeof(field[key])!==value){
            status = 1;
            errorList.push(key);
        }
    }
    if (errorList.length > 0) {
        let msg = "Failed to read data: " + errorList;
        return [status, msg];
    }
    return [status, ""];
};


/**
 * applies 'viewBox-disabled' class to the given elements
 * @param elements an HTML Element or an array containing HTML Elements
 */
let disableViewBox = function(elements) {
    let func = function(el) {
        el.disabled = true;
        el.classList.add("viewBox-disabled");
    };
    if(Array.isArray(elements)){
        elements.forEach(el=>func(el))
    }
    else func(elements)
};

export {userPlugin}