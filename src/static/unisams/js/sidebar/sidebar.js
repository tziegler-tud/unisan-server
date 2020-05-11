(function (common,$,undefined) {

    var sidebar;

    common.Sidebar = function(parentId, content){

        this.sidebarHTML = createHTML(this, content);
        this.parent = $('#'+ parentId);
        this.parent.append(this.sidebarHTML);



        this.isActive = false;

        this.currentState = {
            activeElement: null,

        };


        var self = this;

        sidebar = this;

        return this;
    };

    common.Sidebar.prototype.addContent = function(type, args){
        var self = this;

        switch(type){

            default:
                console.warn("Sidebar: no content type given!");
                showUserContent(self, args);
                break;

            case "user":
                showUserContent(self, args);
                break;

            case "addUser":
                showAddUserContent(self,args);
                break;

            case "UserChangeUsername":
                showUpdateUsernameContent(self, args);
                break;

            case "UserAddDBKey":
                showInsertUserKeyContent(self, args);
                break;

            case "UserAddContactDataKey":
                showInsertContactDataKeyContent(self, args);
                break;

            case "UserAddGeneralDataKey":
                showInsertGeneralDataKeyContent(self, args);
                break;

            case "UserUpdateDBKey":
                showUpdateUserKeyContent(self, args);
                break;

            case "UserUpdateContactKey":
                showUpdateContactDataKeyContent(self, args);
                break;

            case "UserViewDBKey":
                showViewUserKeyContent(self, args);
                break;

            case "UserAddQualification":
                showInsertUserQualificationContent(self,args);
                break;

            case "UserViewQualification":
                showViewUserQualificationContent(self, args);
                break;

            case "UserUpdateQualification":
                showUpdateUserQualificationContent(self,args);
                break;

            case "QualificationCreate":
                showCreateQualificationContent(self,args);
                break;

            case "QualificationUpdate":
                showUpdateQualificationContent(self,args);
                break;

        }

    };

    common.Sidebar.prototype.toggle = function(){

        if(this.isActive){
            this.isActive = false;
            this.sidebarHTML.removeClass("sidebar-active");
            this.parent.removeClass("sidebar-active");
        }
        else {
            this.isActive = true;
            this.sidebarHTML.addClass("sidebar-active");
            this.parent.addClass("sidebar-active");
        }
    };

    common.Sidebar.prototype.show = function(){
        this.sidebarHTML.addClass("sidebar-active");
        this.parent.addClass("sidebar-active");

        this.isActive = true;
    };

    common.Sidebar.prototype.hide = function(){
        this.sidebarHTML.removeClass("sidebar-active");
        this.parent.removeClass("sidebar-active");

        this.isActive = false;
    };

    common.Sidebar.prototype.addErrorMessage = function(msg, insertFunc) {

        var errorHtml = $("<div/>", {
            "class": "sidebar-errorMsg",
            text: msg,
        });
        if (insertFunc == null) {
            this.sidebarHTML.prepend(errorHtml);
        }
        else {
            try {
                insertFunc(errorHtml)
            }
            catch(e) {
                throw new Error(e)
            }
        }
    };

    common.Sidebar.prototype.enableOptional = function(selector){
        $(selector).addClass("optional-enabled");
    };

    common.Sidebar.prototype.disableOptional = function(selector){
        $(selector).removeClass("optional-enabled");
    };

    var showUserContent = function(self, args){

        var userid = args.userid;

        getDataFromServer("/unisams/usermod/"+userid,function(context){
            $.get('/static/unisams/js/sidebar/templates/sidebar-user.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
            });
        })
    };

    var showAddUserContent = function(self, args){
        var context = {};
        var onConfirm = args.callback.onConfirm;
        $.get('/static/unisams/js/sidebar/templates/sidebar-addUser.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(context));
            registerBackButton(self,".sidebar-back-btn");
            registerConfirmButton(self, ".sidebar-confirm", function(){
                onConfirm($("#addUserForm-username").val(), $("#addUserForm-password").val(), $("#addUserForm-firstName").val(), $("#addUserForm-lastName").val());
            }.bind(args));
        });
    };

    var showInsertDBKeyContent = function(self, args){
        // the most generic function, currently not used but left here for future usage

        var userid = args.userid;
        var onConfirm = args.callback.onConfirm;

        getDataFromServer("/unisams/usermod/"+userid,function(context){
            $.get('/static/unisams/js/sidebar/templates/sidebar-addDBKey.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    onConfirm(args.userid, $("#key").val(), $("#value").val());
                }.bind(args));
            });
        })
    };

    var showInsertUserKeyContent = function(self, args){

        var userId = args.userid;
        var onConfirm = args.callback.onConfirm;
        var opt = false;

        var res = {dataset: {}};

        getDataFromServer("/unisams/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/unisams/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        var action = function(context) {
            $.get('/static/unisams/js/sidebar/templates/sidebar-addUserKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));

                var catKey = "";
                var key = "";

                registerBackButton(self, ".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function () {
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
                    populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
                        createNewEntry: true,
                    });
                    catKey = q.options[q.selectedIndex].value;
                });
                // Apply onchange function initially
                var event = new Event('change');
                q.dispatchEvent(event);
            });
        };
    };

    var showInsertGeneralDataKeyContent = function(self, args){

        var userId = args.userid;
        var onConfirm = args.callback.onConfirm;
        var opt = false;

        var res = {dataset: {}};

        getDataFromServer("/unisams/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/unisams/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        var action = function(context) {
            $.get('/static/unisams/js/sidebar/templates/sidebar-addGeneralDataKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));

                var catKey = args.catKey;
                var key = "";

                var r = document.getElementById("userkey-key");
                var q = document.getElementById("userkey-category");
                var v = document.getElementById("userkey-value");
                let doc = res.dataset.user.categories;
                registerBackButton(self, ".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function () {
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
                populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
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
                    var val = findExistingValues(context.exploreUser,tmpKey);
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
    };

    var showInsertContactDataKeyContent = function(self, args){

        var userId = args.userid;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;
        var catKey = args.catKey;
        var opt = false;

        var res = {dataset: {}};

        getDataFromServer("/unisams/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/unisams/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        var action = function(context) {
            $.get('/static/unisams/js/sidebar/templates/sidebar-addContactDataKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));

                var r = document.getElementById("userkey-key");
                var q = document.getElementById("userkey-category");
                var v = document.getElementById("userkey-value");

                registerBackButton(self, ".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function () {
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

                registerButton (self, ".sidebar-delete", function(){

                    // delete array entry
                    data = {
                        id: qualId,
                        qualification: res.currentQualification.qualification,
                    };
                    if (corrupted) {
                        data.qualification = {qualType: "error", name: "error"}
                    }
                    onDelete(args.userid, data);
                });

                let doc = res.dataset.user.categories;

                // set current category
                setCurrentUserKey(q,catKey);
                // populate
                populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
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
    };

    var showUpdateUsernameContent = function(self, args){

        var userId = args.userid;
        var key = args.key;
        var value = args.value;
        var onConfirm = args.callback.onConfirm;
        var corrupted = false;

        var res = {};

        getDataFromServer("/unisams/usermod/"+ userId,function(context){
            res.exploreUser = context;
            action(res)
        });

        var action = function(context) {
            $.get('/static/unisams/js/sidebar/templates/sidebar-updateUsername.hbs', function (data) {

                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));

                registerBackButton(self, ".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    data = {
                        value: document.getElementById("userkey-value").value
                    };
                    onConfirm(args.userid, key, data.value);
                }.bind(args));

            });
        };
    };

    var showUpdateUserKeyContent = function(self, args){

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

        var type = (isCustomEntry) ? args.type : undefined;

        getDataFromServer("/unisams/usermod/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/unisams/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        var action = function(context) {
            $.get('/static/unisams/js/sidebar/templates/sidebar-updateUserKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));

                var q = document.getElementById("userkey-category");
                var r = document.getElementById("userkey-key");
                var v = document.getElementById("userkey-value");
                let doc = res.dataset.user.categories;

                registerBackButton(self, ".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
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

                registerButton (self, ".sidebar-delete", function(){

                    // delete array entry
                    data = {
                        title: key
                    };
                    if (corrupted) {
                    }
                    onDelete(args.userid, key, data);
                });

                q.addEventListener("change", function(e){
                    populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
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
    };

    var showUpdateContactDataKeyContent = function(self, args){

        var userId = args.userid;
        var key = args.key;
        var catKey = args.catKey;
        var field = args.field;
        var type = args.type;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {dataset: {}};
        res.exploreUser = args.user;
        var corrupted = false;

        var isCustomEntry = (type === "customData");

        getDataFromServer("/unisams/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            action(res);
        });

        var action = function(context) {
            $.get('/static/unisams/js/sidebar/templates/sidebar-updateContactDataKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));

                var r = document.getElementById("userkey-key");
                var q = document.getElementById("userkey-category");
                var v = document.getElementById("userkey-value");

                registerBackButton(self, ".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    var key = catKey;
                    var type = r.value;
                    var title = r.options[r.selectedIndex].dataset.title;

                    var funcArgs = {
                        isArray: common.stringToBoolean(r.options[r.selectedIndex].dataset.isarray),
                        noIndex: true,
                    };
                    var val = {
                        value: v.value,
                        id: field._id,
                        title: r.options[r.selectedIndex].dataset.title,
                        type: type
                    };
                    if (sidebar.currentState.customEntryActive) {
                        val.title = document.getElementById("custom-type").value;
                    }
                    onConfirm(args.userid, key, val, funcArgs);
                }.bind(args));

                registerButton (self, ".sidebar-delete", function(){

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
                    self.addErrorMessage("trying to read corrupted data!\n" + msg,  function(data){
                        $("#sidebar-inner").before(data);
                    });
                }

                let doc = res.dataset.user.categories;
                q.addEventListener("change", function(e){
                    populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
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
                            key: "data-type",
                            value: field.type,
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
    };

    var showViewUserKeyContent = function(self, args){

        var userId = args.userid;
        var keyId = args.keyId;
        var key = args.key;
        var catKey = args.catKey;
        var subKey = args.subKey;
        var value = args.value;

        var res = {dataset: {}};
        var corrupted = false;

        getDataFromServer("/unisams/user/"+ userId,function(context){
            res.exploreUser = context;
            if (res.dataset.user){
                action(res)
            }
        });

        getDataFromServer("/unisams/dataset/user/getCategories", function(context){
            res.dataset.user = context;
            if (res.exploreUser){
                action(res);
            }
        });

        var action = function(context) {
            $.get('/static/unisams/js/sidebar/templates/sidebar-viewUserKey.hbs', function (data) {

                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));

                registerBackButton(self, ".sidebar-back-btn");
                var q = document.getElementById("userkey-category");
                var r = document.getElementById("userkey-key");
                var v = document.getElementById("userkey-value");
                let doc = res.dataset.user.categories;
                // set current category
                setCurrentUserKey(q,catKey);
                // Apply onchange function initially
                populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
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
    };

    var showInsertUserQualificationContent = function(self, args){

        var userId = args.userid;
        var catKey = args.catKey;
        var onConfirm = args.callback.onConfirm;

        var res = {qualifications: {}};

        getDataFromServer("/unisams/usermod/"+userId,function(context){
            res.exploreUser = context;
            if (res.qualifications.byType){
                action(res)
            }
        });

        getDataFromServer("/unisams/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            if (res.exploreUser){
                action(res);
            }
        });
        var action = function(context){
            $.get('/static/unisams/js/sidebar/templates/sidebar-addUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
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
    };

    var showViewUserQualificationContent = function(self, args){

        var userId = args.userid;
        var qualId = args.qualificationId;

        var res = {qualifications: {}};

        var corrupted = false;

        getDataFromServer("/unisams/usermod/"+userId,function(context){
            res.exploreUser = context;
            res.currentQualification = context.qualifications.find(qual => qual._id === qualId);
            action(res)
        });

        var action = function(context){
            $.get('/static/unisams/js/sidebar/templates/sidebar-viewUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");

                if(!populateCurrentQualificationDefault(self, res.qualifications.byType, res.currentQualification.qualification)){
                    console.warn("trying to read corrupted data");
                    self.addErrorMessage("trying to read corrupted data!",  function(data){
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
    };

    var showUpdateUserQualificationContent = function(self, args){

        var userId = args.userid;
        var key = args.key;
        var keyId = args.keyId;
        var qualId = args.qualificationId;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {qualifications: {}};

        var corrupted = false;

        getDataFromServer("/unisams/usermod/"+userId,function(context){
            res.exploreUser = context;
            res.currentQualification = context.qualifications.find(qual => qual._id === qualId);
            if (res.qualifications.byType){
                action(res)
            }
        });

        getDataFromServer("/unisams/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            if (res.exploreUser){
                action(res);
            }
        });

        var action = function(context){
            $.get('/static/unisams/js/sidebar/templates/sidebar-updateUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){

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

                registerButton (self, ".sidebar-delete", function(){

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

                if(!populateCurrentQualificationDefault(self, res.qualifications.byType, res.currentQualification.qualification)){
                    console.warn("trying to read corrupted data");
                    self.addErrorMessage("trying to read corrupted data!",  function(data){
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
    };

    var showUpdateQualificationContent = function(self, args){

        var qualId = args.qualificationId;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {qualifications: {}};

        getDataFromServer("/unisams/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            res.currentQualification = findQualByIdInTypeArray(context, qualId);
            action(res);

        });

        var action = function(context){
            var opt = false;
            $.get('/static/unisams/js/sidebar/templates/sidebar-updateQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    data = {
                        id: qualId,
                        qualType: $("#qual-type").val(),
                    };
                    if(opt) {
                        data.name = $("#custom-name").val();
                    }
                    else {
                        data.name = $("#qual-name").val();
                    }
                    onConfirm(qualId, data);
                }.bind(args));

                registerButton (self, ".sidebar-delete", function(){
                    // delete array entry
                    data = res.currentQualification;
                    onDelete(qualId, data);
                });

                // populate selects with current content as default
                if(!populateCurrentQualificationDefault(self, res.qualifications.byType, res.currentQualification, {addCreateEntry: true})){
                    console.warn("trying to read corrupted data");
                    self.addErrorMessage("trying to read corrupted data!",  function(data){
                        $("#sidebar-inner").before(data);
                    });

                    $("#qual-type").addClass("select-disabled");
                    $("#qual-name").addClass("select-disabled");
                }
                $("#qual-type").prop('disabled', 'disabled').addClass("select-disabled");
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
                $("#qual-name").on("change",function(e) {
                    if (e.target.value === "enableOptional_custom-name"){
                        self.enableOptional(".ak-customName");
                        opt = true;
                    }
                    else {
                        self.disableOptional(".ak-customName");
                        opt = false;
                    }
                });

            });
        };
    };

    var showCreateQualificationContent = function(self, args){

        var onConfirm = args.callback.onConfirm;
        var res = {qualifications: {}};

        getDataFromServer("/unisams/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            action(res);

        });

        var action = function(context){
            var opt = false;
            $.get('/static/unisams/js/sidebar/templates/sidebar-createQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    data = {
                        name:  $("#qual-name").val(),
                    };
                    if(opt) {
                        data.qualType = $("#custom-type").val();
                    }
                    else {
                        data.qualType = $("#qual-type").val();
                    }
                    onConfirm(false, data);
                }.bind(args));
                $("#qual-type").on("change",function(e) {
                    if (e.target.value === "enableOptional_custom-type"){
                        self.enableOptional(".ak-customType");
                        opt = true;
                    }
                    else {
                        self.disableOptional(".ak-customType");
                        opt = false;
                    }
                });
            });
        };
    };



    var registerBackButton = function(self, selector){

      $(selector).each(function(){
          $(this).on("click", function(e){
              self.toggle();
              $(this).toggleClass("btn-rotate");
          });
      })
    };

    var registerConfirmButton = function(self, selector, action){
        var args = this;
        $(selector).on("click", function(args){
            action();
        });
    };

    var registerButton = function(self, selector, action){
        var args = this;
        $(selector).on("click", function(args){
            action();
        });
    };

    var getDataFromServer  = function(url, callback){

        // get qualification data from server
        $.ajax({
            url: url,
            type: 'GET',
            cache: false,
            isModified: false,
            data: {},
            success: callback,
        });
    };



    var createHTML = function(self){

        return $('<div/>', {
            id: "sidebar-container",
            class: "sidebar-container",

        });
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

    var populateCurrentQualificationDefault = function(self, doc, current, args){
        if (args === undefined) args = {};

        // check if data are valid
        if (!checkQualificationDataValidity(current)){
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
                var delimiter = createSelectDelimiter();
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
     * user data operations
     *
     */

    var populateUserKeys = function(sidebar, doc, compareValue, args){
        if (args === undefined) args = {};

        //find selected category
        var current = doc.find(element => element._id === compareValue);
        getDataFromServer("/unisams/dataset/user/getChildren/" + current._id, function (context) {
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
                    const delimiter = createSelectDelimiter();
                    userkeyObject.add(delimiter);

                    // add option to create new key
                    const option = document.createElement('option');
                    option.value = "customData";
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
                let val = findExistingValues(data.doc, data.key);
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

    /**
     * ui elements
     */

    var createSelectDelimiter = function(classes){
        const delimiter = document.createElement('option');
        delimiter.innerHTML = "-----------------------";
        delimiter.disabled = true;
        return delimiter;

    };

    /**
     * helpers
     */

    var findExistingValues = function(doc, key) {
        const val = common.refJSON(doc,key);
        if (val){
            // if key refers to array, do not find values.
            if (Array.isArray(val)) return undefined;
            else return val;
        }
        else return undefined;
    };

    /**
     *
     * @param currentQualification
     * @returns {boolean}
     */

    var checkQualificationDataValidity = function(currentQualification){
        if(currentQualification == null) {
            return false;
        }
        else {
            if (currentQualification.qualType == null || currentQualification.name == null) {
                return false;
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
    return common.Sidebar;
}(window.common = window.common || {}, jQuery));