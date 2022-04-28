import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar.js";

const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";
import {getDataFromServer} from "../../helpers/helpers";

let userPlugin = new SidebarPlugin("user");

let showUser = new ContentHandler("user",
    function(sidebar, args, type) {
        var userid = args.userid;
        getDataFromServer("/api/v1/usermod/"+userid,function(context){
            $.get('/webpack/sidebar/templates/sidebar-user.hbs', function (data) {
                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(sidebar,".sidebar-back-btn");
            });
        })
    });
let addUser = new ContentHandler("addUser", 
    function(sidebar, args, type) {
        var context = {};
        var onConfirm = args.callback.onConfirm;
        $.get('/webpack/sidebar/templates/sidebar-addUser.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(sidebar,".sidebar-back-btn");
            sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                let generalData = {
                    firstName: $("#addUserForm-firstName").val(),
                    lastName: $("#addUserForm-lastName").val(),
                };
                let memberId = {
                    setCustom: false,
                };
                onConfirm($("#addUserForm-username").val(), $("#addUserForm-password").val(), generalData, memberId);
            }.bind(args));
        });
    
    });

let changeUsername = new ContentHandler("UserChangeUsername",
    function(sidebar, args, type) {
        var userId = args.userid;
        var key = args.key;
        var value = args.value;
        var onConfirm = args.callback.onConfirm;
        var corrupted = false;

        var res = {};

        getDataFromServer("/api/v1/usermod/"+ userId,function(context){
            res.exploreUser = context;
            action(res)
        });

        var action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-updateUsername.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                    data = {
                        value: document.getElementById("userkey-value").value
                    };
                    onConfirm(args.userid, key, data.value);
                }.bind(args));

            });
        };
    });

let addDbKey = new ContentHandler("UseraddDBKey",
    function(sidebar, args, type) {

        var userId = args.userid;
        var onConfirm = args.callback.onConfirm;
        var opt = false;

        var res = {dataset: {}};

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

        var action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-addUserKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                var catKey = "";
                var key = "";

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function () {
                    var r = document.getElementById("userkey-key");
                    var key = catKey + "." + r.value;
                    var funcArgs = {
                        isArray: r.options[r.selectedIndex].dataset.isarray
                    };
                    var val = {
                        value: document.getElementById("userkey-value").value,
                        title: "TestTitle2",
                    };
                    onConfirm(userId, key, val, funcArgs);
                }.bind(args));
                var q = document.getElementById("userkey-category");
                let doc = res.dataset.user.categories;
                q.addEventListener("change", function(e){
                    populateUserKeys(sidebar, doc, q.options[q.selectedIndex].dataset.datasetid, {
                        createNewEntry: true,
                    });
                    catKey = q.options[q.selectedIndex].value;
                });
                // Apply onchange function initially
                var event = new Event('change');
                q.dispatchEvent(event);
            });
        };

    });

let addContactData= new ContentHandler("UserAddContactDataKey",
    function(sidebar, args, type) {
        var userId = args.userid;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;
        var catKey = args.catKey;
        var opt = false;

        var res = {dataset: {}};

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

        var action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-addContactDataKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                var r = document.getElementById("userkey-key");
                var q = document.getElementById("userkey-category");
                var v = document.getElementById("userkey-value");

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function () {
                    var key = catKey;
                    var type = r.value;
                    var title = r.options[r.selectedIndex].dataset.title;

                    var funcArgs = {
                        isArray: common.stringToBoolean(r.options[r.selectedIndex].dataset.isarray),
                        noIndex: true
                    };
                    var val = {
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
                }.bind(args));

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
        var userId = args.userid;
        var onConfirm = args.callback.onConfirm;
        var opt = false;

        var res = {dataset: {}};

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

        var action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-addGeneralDataKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                var catKey = args.catKey;
                var key = "";

                var r = document.getElementById("userkey-key");
                var q = document.getElementById("userkey-category");
                var v = document.getElementById("userkey-value");
                let doc = res.dataset.user.categories;
                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function () {
                    var key = catKey + "." + r.value;
                    var funcArgs = {
                        isArray: common.stringToBoolean(r.options[r.selectedIndex].dataset.isarray),
                        noIndex: true
                    };
                    var val = {
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
                }.bind(args));

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
                    var tmpKey = catKey + "." + r.value;
                    var val = sidebar.findExistingValues(context.exploreUser,tmpKey);
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
        var userId = args.userid;
        var keyId = args.keyId;
        var key = args.key;
        var catKey = args.catKey;
        var subKey = args.subKey;
        var value = args.value;
        var isCustomEntry = args.isCustomEntry;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {dataset: {}};
        var corrupted = false;

        var ctype = (isCustomEntry) ? args.type : undefined;

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

        var action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-updateUserKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                var q = document.getElementById("userkey-category");
                var r = document.getElementById("userkey-key");
                var v = document.getElementById("userkey-value");
                let doc = res.dataset.user.categories;

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                    var funcArgs = {
                        isArray: common.stringToBoolean(r.options[r.selectedIndex].dataset.isarray),
                        noIndex: true
                    };
                    var val = {
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
                }.bind(args));

                sidebar.registerButton (sidebar, ".sidebar-delete", function(){

                    // delete array entry
                    data = {
                        title: key
                    };
                    if (corrupted) {
                    }
                    onDelete(args.userid, key, data);
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
                var event = new Event('change');
                q.dispatchEvent(event);
            });
        };
    });

let updateContactKey = new ContentHandler("UserUpdateContactKey",
    function(sidebar, args, type) {
        var userId = args.userid;
        var key = args.key;
        var catKey = args.catKey;
        var field = args.field;
        var ctype = args.type;
        var isDefault = args.default;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {dataset: {}};
        res.exploreUser = args.user;
        res.contactEntry = field;
        var corrupted = false;

        var isCustomEntry = false;
        var filterValue = field.title;
        if (ctype === "customData") {
            isCustomEntry = true;
            filterValue = "customData";
        }

        getDataFromServer("/api/v1/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            action(res);
        });

        var action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-updateContactDataKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                var r = document.getElementById("userkey-key");
                var q = document.getElementById("userkey-category");
                var v = document.getElementById("userkey-value");
                var def = document.getElementById("default-checkbox");

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                    var key = catKey;
                    var ctype = r.value;
                    var title = r.options[r.selectedIndex].dataset.title;

                    var funcArgs = {
                        isArray: true,
                        noIndex: true,
                    };
                    var val = {
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
                }.bind(args));

                sidebar.registerButton (sidebar, ".sidebar-delete", function(){

                    // delete array entry
                    data = {
                        title: key
                    };
                    if (corrupted) {
                    }
                    onDelete(args.userid, key, data);
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
                var event = new Event('change');
                q.dispatchEvent(event);
            });
        };
    });

let viewDbKey = new ContentHandler("UserViewDBKey",
    function(sidebar, args, type) {
        var userId = args.userid;
        var keyId = args.keyId;
        var key = args.key;
        var catKey = args.catKey;
        var subKey = args.subKey;
        var value = args.value;

        var res = {dataset: {}};
        var corrupted = false;

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

        var action = function(context) {
            $.get('/webpack/sidebar/templates/sidebar-viewUserKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                var q = document.getElementById("userkey-category");
                var r = document.getElementById("userkey-key");
                var v = document.getElementById("userkey-value");
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
        var userId = args.userid;
        var catKey = args.catKey;
        var onConfirm = args.callback.onConfirm;

        var res = {qualifications: {}};

        getDataFromServer("/api/v1/usermod/"+userId,function(context){
            res.exploreUser = context;
            if (res.qualifications.byType){
                action(res)
            }
        });

        getDataFromServer("/api/v1/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            if (res.exploreUser){
                action(res);
            }
        });
        var action = function(context){
            $.get('/webpack/sidebar/templates/sidebar-addUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(sidebar,".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                    const id = document.getElementById("qual-name").selectedOptions[0].id;
                    var key = catKey;
                    data = {
                        qualification: findQualByIdInTypeArray(res.qualifications.byType, id),
                        acquiredDate: $("#qual-acquiredDate").val(),
                        expireDate: $("#qual-expireDate").val(),
                        trainingDate: $("#qual-trainingDate").val(),
                    };
                    onConfirm(args.userid, key, data);
                }.bind(args));
                var q = $("#qual-type");
                q.on("change",function(e){
                    var typeData = res.qualifications.byType.find(element => element._id === e.target.value);
                    var qualNameObject = document.getElementById("qual-name");
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
        var userId = args.userid;
        var qualId = args.qualificationId;

        var res = {qualifications: {}};

        var corrupted = false;

        getDataFromServer("/api/v1/usermod/"+userId,function(context){
            res.exploreUser = context;
            res.currentQualification = context.qualifications.find(qual => qual._id === qualId);
            action(res)
        });

        var action = function(context){
            $.get('/webpack/sidebar/templates/sidebar-viewUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(sidebar,".sidebar-back-btn");

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
        var userId = args.userid;
        var key = args.key;
        var keyId = args.keyId;
        var qualId = args.qualificationId;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {qualifications: {}};

        var corrupted = false;

        getDataFromServer("/api/v1/usermod/"+userId,function(context){
            res.exploreUser = context;
            res.currentQualification = context.qualifications.find(qual => qual._id === qualId);
            if (res.qualifications.byType){
                action(res)
            }
        });

        getDataFromServer("/api/v1/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            if (res.exploreUser){
                action(res);
            }
        });

        var action = function(context){
            $.get('/webpack/sidebar/templates/sidebar-updateUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(sidebar,".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){

                    //helper to find qualification document in groupByType array
                    const id = document.getElementById("qual-name").selectedOptions[0].id;
                    data = {
                        id: keyId,
                        qualification: findQualByIdInTypeArray(res.qualifications.byType, id),
                        acquiredDate: $("#qual-acquiredDate").val(),
                        expireDate: $("#qual-expireDate").val(),
                        trainingDate: $("#qual-trainingDate").val(),
                    };
                    onConfirm(args.userid, key, data);
                }.bind(args));

                sidebar.registerButton (sidebar, ".sidebar-delete", function(){

                    // delete array entry
                    data = {
                        id: keyId,
                        qualification: res.currentQualification.qualification,
                    };
                    if (corrupted) {
                        data.qualification = {qualType: "error", name: "error"}
                    }
                    onDelete(args.userid, key, data);
                });

                if(!populateCurrentQualificationDefault(sidebar, res.qualifications.byType, res.currentQualification.qualification)){
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
                var q = document.getElementById("qual-type");
                $(q).on("change",function(e){
                    var typeData = res.qualifications.byType.find(element => element._id === e.target.value);
                    var qualNameObject = document.getElementById("qual-name");
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
        var userId = args.userid;
        var key = args.key;
        var onConfirm = args.callback.onConfirm;
        var corrupted = false;

        var res = {};

        getDataFromServer("/api/v1/acl/"+ userId,function(context){
            res.acl = context;
            action(res)
        });

        var action = function(context) {
            $.get('/webpack/sidebar/templates/user/sidebar-updateUserRole.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                $("#changeUserRole-select").val(context.acl.userRole);

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                    data = {
                        userId: userId,
                        role: $("#changeUserRole-select").val(),
                    };
                    onConfirm(data);
                }.bind(args));

            });
        };
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

//TODO: make Sidebar a singleton and add static function to access runtime object


/**
 * user data operations
 *
 */

var populateUserKeys = function(sidebar, doc, compareValue, args){
    if (args === undefined) args = {};

    //find selected category
    var current = doc.find(element => element._id === compareValue);
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
                var event = new Event('change');
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
            var filter = args.filter;
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

var setCurrentUserKey = function(selectElement, key){
    $(selectElement).children('option').filter(function (i, e) {
        return e.value === key
    }).attr('selected', true);
};



/*
helpers for the updating operations
 */

var findQualByIdInTypeArray = function(byTypeArr, qualId){
    var localmatch;
    byTypeArr.forEach(function(qual){
        var match = qual.values.find(qualEntry => qualEntry._id === qualId);
        if (match != null) {
            localmatch = match;
        }
    });
    return localmatch;
};

var populateCurrentQualificationDefault = function(sidebar, doc, current, args){
    if (args === undefined) args = {};

    // check if data are valid
    if (!sidebar.checkQualificationDataValidity(current)){
        return false;
    }
    else {
        var typeData = doc.find(element => element._id === current.qualType);
        var qualNameObject = document.getElementById("qual-name");
        var q = document.getElementById("qual-type");
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
            var delimiter = sidebar.createSelectDelimiter();
            qualNameObject.append(delimiter);

            var createEntry = document.createElement('option');
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
var checkDataValidity = function(field, dataset){
    var errorList = [];
    var status = 0;
    for (let [key, value] of Object.entries(dataset)){
        if(typeof(field[key])!==value){
            status = 1;
            errorList.push(key);
        }
    }
    if (errorList.length > 0) {
        var msg = "Failed to read data: " + errorList;
        return [status, msg];
    }
    return [status, ""];
};


/**
 * applies 'viewBox-disabled' class to the given elements
 * @param elements an HTML Element or an array containing HTML Elements
 */
var disableViewBox = function(elements) {
    var func = function(el) {
        el.disabled = true;
        el.classList.add("viewBox-disabled");
    };
    if(Array.isArray(elements)){
        elements.forEach(el=>func(el))
    }
    else func(elements)
};

export {userPlugin}