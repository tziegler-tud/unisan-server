import "./sidebar.scss";
import "./sidebar-addParticipant.scss";
import "./sidebar-events.scss";
import "./sidebar-logs.scss";

let SidebarCounter = {
    counter: 0,
    next: function(){
        this.counter++;
        return this.counter;
    },
    current: function(){
      return this.counter;
    }
}

/**
 *
 * Constructor of sidebar object.
 *
 *
 * @param {String} parentId  Id of sidebar container element
 * @param {String}  content String denoting content type. Valid options are: ["user", "addUser", "UserChangeUsername", "UserAddDBKey", "UserAddContactDataKey", "UserAddGeneralDataKey", "UserUpdateDBKey", "UserUpdateContactKey", "UserViewDBKey", "UserAddQualification", "UserViewQualification", "UserUpdateQualification", "QualificationCreate", "QualificationUpdate", "eventDetails", "eventParticipants", "addEventParticipant", "addEventParticipant", "logDetails"]
 * @param {String} [optionalId]  DOM Id of the sidebar object to be created. Optional, defaults to "sidebarX", where X is a unique integer for each sidebar created by this method.
 * @returns {Sidebar}
 * @constructor
 */

var Sidebar = function(parentId, content, optionalId){

    this.plugins = [];
    this.contentHandlers = [];
    this.parent = $('#'+ parentId);
    this.domId = optionalId === undefined ? "sidebar" + SidebarCounter.next() : optionalId;
    this.isActive = false;
    this.currentState = {
        activeElement: null,
    };
    this.sidebarHTML = createHTML(this, content);
    this.parent.append(this.sidebarHTML);

    return this;
};

/**
 *
 * Sidebar plugins extends the sidebar functionality by providing handlers for custom content types.
 *
 * @param name {String}
 * @returns {SidebarPlugin}
 * @constructor
 */
var SidebarPlugin = function(name) {
    this.name = name;
    this.handlers = [];
    return this;
}

SidebarPlugin.prototype.addContentHandler = function(contentHandler) {
    this.handlers.push(contentHandler);
}

/**
 *
 * generates a new contentHandler object
 *
 * @param type {String}
 * @param handlerFunction {Function}
 * @constructor
 */
var ContentHandler = function(type, handlerFunction) {
    this.type = type;
    this.fn = handlerFunction;
    return this;
}

Sidebar.prototype.addContentHandler = function(contentHandler) {
    this.contentHandlers.push(contentHandler);
}

Sidebar.prototype.addPlugin = function(sidebarPlugin){
    this.plugins.push(sidebarPlugin);
    let sidebar = this;
    sidebarPlugin.handlers.forEach(function(handler){
        sidebar.addContentHandler(handler);
    })

}

/**
 *
 * @param args {Object} constructor arguments
 * @param args.sidebar {Object} sidebar object to associate this button with
 * @param args.selector {string} container selector
 * @param args.type {string} "cancel", "confirm", "delete", "custom"
 * @param args.handler {function} handler function, optional for back buttons
 * @param args.enabled {Boolean} true if the button should initially be enabled
 * @returns {SidebarButton}
 * @constructor
 */
var SidebarButton = function(args) {
    let self = this;
    let defaultArgs = {
        sidebar: undefined,
        selector: undefined,
        type: "custom",
        handler: function(){},
        enabled: true,
    }
    args = Object.assign(defaultArgs, args);
    this.sidebar = args.sidebar;
    this.selector = args.selector;
    this.type = args.type;
    this.handler = args.handler;
    this.enabled = args.enabled;

    if (this.selector === undefined) {
        console.error("Failed to create SidebarButton: Invalid Selector")
        return false;
    }
    let item = document.querySelector(this.selector);
    if(item === undefined || item === null) {
        console.error("Failed to create SidebarButton: Invalid Selector")
        return false;
    }
    this.container = item;
    this.button = this.container.querySelector('button')
    if (this.button === null || this.button === undefined) this.button = this.container;

    if(this.type === undefined || typeof(this.type) !== "string") this.type = "custom";
    this.container.classList.add("sidebarButton");
    switch(this.type) {
        case "back":
            self.container.classList.add("sidebarButton--back");
            self.handler = function(self){
                self.sidebar.toggle();
            }
            break;
        case "confirm":
            self.container.classList.add("sidebarButton--confirm");
            break;
        case "cancel":
            self.container.classList.add("sidebarButton--cancel");
            self.handler = function(self){
                self.sidebar.resetCurrentPage();
                self.sidebar.toggle();
            }
            break;
        case "reset":
            self.container.classList.add("sidebarButton--reset");
            self.handler = function(self){
                self.sidebar.resetCurrentPage();
            }
            break;
        case "delete":
            self.container.classList.add("sidebarButton--delete");
            break;
        default:
        case "custom":
            self.container.classList.add("sidebarButton--custom");
            break;
    }
    this.container.addEventListener("click", function(){
        if(self.enabled) {
            self.handler(self)
        }
    })
    if(!self.enabled){
        self.disable();
    }
}

SidebarButton.prototype.disable = function(){
    this.container.classList.add("sidebarButton-disabled");
    this.button.disabled = true;
    this.enabled = false;
}


SidebarButton.prototype.enable = function(){
    this.container.classList.remove("sidebarButton-disabled");
    this.button.disabled = false;
    this.enabled = true;
}

/***
 * adds content of a specific type
 * @param {String} type string denoting the type of content to be rendered
 * @param {Object} args args object. This is passed to subsequent methods.
 */
Sidebar.prototype.addContent = function(type, args){
    var self = this;
    self.currentPage = {
        type: type,
        args: args,
    }

    //look for handler
    let handler = this.contentHandlers.find(handler => handler.type === type);
    if (handler === undefined) {
        console.error("Sidebar error: No handler found for given content type: " + type);
        return false;
    }
    else {
        handler.fn(self, args, type)
    }

    switch(type){

        case "QualificationCreate":
            showCreateQualificationContent(self,args);
            break;

        case "QualificationUpdate":
            showUpdateQualificationContent(self,args);
            break;

        case "logDetails":
            showLogDetails(self,args);
            break;
    }
};

/**
 * refreshs the current sidebar content by re-rendering with current settings
 */
Sidebar.prototype.update = function(args){
    let newArgs = Object.assign(this.currentPage.args, args);
    this.addContent(this.currentPage.type, newArgs);
}

/**
 * toggles the sidebar activity state.
 */

Sidebar.prototype.toggle = function(){

    if(this.isActive){
        this.isActive = false;
        this.sidebarHTML.removeClass("sidebar-active");
        this.parent.removeClass("sidebar-active");
        document.body.classList.remove("noscroll");
    }
    else {
        this.isActive = true;
        this.sidebarHTML.addClass("sidebar-active");
        this.parent.addClass("sidebar-active");
        document.body.classList.add("noscroll");
    }
};

/**
 * shows the sidebar
 */
Sidebar.prototype.show = function(){
    this.sidebarHTML.addClass("sidebar-active");
    this.parent.addClass("sidebar-active");
    document.body.classList.add("noscroll");

    this.isActive = true;
};

/**
 * hides the sidebar
 */
Sidebar.prototype.hide = function(){
    this.sidebarHTML.removeClass("sidebar-active");
    this.parent.removeClass("sidebar-active");
    document.body.classList.remove("noscroll");

    this.isActive = false;
};

/**
 *
 * adds a highlighted error message to the sidebar
 *
 * @param msg {String} error message
 * @param insertFunc {Function} custom function to insert the error message into dom tree. Receives the generated error html as argument.
 * @param overwrite {Boolean} [false] overwrites previous error messages if set to true
 * @param warning {Boolean} [false] displays the message as warning instead
 */
Sidebar.prototype.addErrorMessage = function(msg, insertFunc, overwrite, warning) {

    msg = (msg === undefined) ? "Something went wrong" : msg;
    overwrite = (overwrite === undefined) ? false : overwrite;
    warning = (warning === undefined) ? false : warning;
    if (overwrite){
        //clear previous errors
        $(".sidebar-errorMsg").remove();
    }
    let c = "sidebar-errorMsg"
    if(warning) {
       c = "sidebar-errorMsg warnMsg"
    }
    var errorHtml = $("<div/>", {
        "class": c,
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

Sidebar.prototype.enableOptional = function(selector){
    $(selector).addClass("optional-enabled");
};

Sidebar.prototype.disableOptional = function(selector){
    $(selector).removeClass("optional-enabled");
};

    var showUpdateQualificationContent = function(self, args){

        var qualId = args.qualificationId;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {qualifications: {}};

        getDataFromServer("/api/v1/qualification/groupByType", function(context){
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

        getDataFromServer("/api/v1/qualification/groupByType", function(context){
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

    /* events */



    var showLogDetails = function(self, args){

        let log = args.log;
        let handleData = {
            log: log,
        }

        $.get('/static/unisams/js/sidebar/templates/sidebar-viewLogEntry.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(handleData));
            registerBackButton(self,".sidebar-back-btn");
            registerButton (self, ".sidebar-delete", function(){
                // delete log entry
                $.ajax({
                    url: "/api/v1/logs/" + log.id,
                    type: 'DELETE',
                    contentType: "application/json; charset=UTF-8",
                    success: function(result) {
                        window.location.reload();
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        // alert(textStatus + ": " + XMLHttpRequest.status + " " + errorThrown);
                        if (XMLHttpRequest.status===403) self.addErrorMessage("Operation not permitted.", function(data){
                            $("#sidebar-inner").before(data);
                        }, true);
                    }
                });

            });
        });

    };



var registerBackButton = function(self, selector){

  // $(self.sidebarHTML).find($(selector)).each(function(){
  $(selector).each(function(){
      $(this).on("click", function(e){
          self.toggle();
          // $(this).toggleClass("btn-rotate");
      });
  })
};

Sidebar.prototype.registerBackButton = function(selector) {
    let self = this;
    return new SidebarButton({
        sidebar: self,
        selector: selector,
        type: "back",
        handler: function(){
            self.toggle()
        },
        enabled: true,
    })
}


Sidebar.prototype.registerCancelButton = function(selector) {
    let self = this;
    return new SidebarButton({
        sidebar: self,
        selector: selector,
        type: "cancel",
        handler: function(){
            self.resetCurrentPage();
            self.toggle();
        },
        enabled: true,
    })
}

var registerConfirmButton = function(self, selector, action){
    var args = this;
    $(selector).on("click", function(args){
        action();
    });
};

Sidebar.prototype.registerConfirmButton = function(selector, handler) {
    let self = this;
    return new SidebarButton({
        sidebar: self,
        selector: selector,
        type: "confirm",
        handler: handler,
        enabled: true,
    })
}

var registerButton = function(self, selector, action){
    var args = this;
    $(selector).on("click", function(args){
        action();
    });
};

Sidebar.prototype.registerDeleteButton = function(selector, handler) {
    let self = this;
    return new SidebarButton({
        sidebar: self,
        selector: selector,
        type: "delete",
        handler: handler,
        enabled: true,
    })
}

Sidebar.prototype.registerButton = function(selector, handler) {
    let self = this;
    return new SidebarButton({
        sidebar: self,
        selector: selector,
        type: "custom",
        handler: handler,
        enabled: true,
    })
}



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

Sidebar.prototype.getDataFromServer = function(url, callback) {
    getDataFromServer(url, callback);
}



var createHTML = function(self){

    return $('<div/>', {
        id: self.domId,
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
                const delimiter = createSelectDelimiter();
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

Sidebar.prototype.createSelectDelimiter = function(classes){
    return createSelectDelimiter(classes);
}

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
Sidebar.prototype.findExistingValues = function(doc, key){
    return findExistingValues(doc, key);
}


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

Sidebar.prototype.checkQualificationDataValidity = function(currentQualification){
    return checkQualificationDataValidity(currentQualification);
}

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

Sidebar.prototype.checkDataValidity = function(field, dataset){
    return checkDataValidity(field, dataset);
}

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

Sidebar.prototype.resetCurrentPage = function(){
    this.addContent(this.currentPage.type, this.currentPage.args);
}

export {Sidebar, SidebarPlugin, ContentHandler, SidebarButton}