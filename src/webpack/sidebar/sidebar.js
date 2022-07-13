import "./sidebar.scss";

import "./sidebar-logs.scss";

import {phone, tablet} from "../helpers/variables";
import {MDCTooltip} from "@material/tooltip";

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
    this.storage = [];
    this.currentState = {
        activeElement: null,
    };
    this.hasDefault = false;
    this.defaultPage = {
      type: undefined,
      args: {}
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
 * @param args
 * @param args.anchor {HTMLElement} anchor element
 * @param args.content {String} tooltip content
 * @returns {SidebarTooltip}
 * @constructor
 */
var SidebarTooltip = function(args) {
    let defaultArgs = {
        anchor: undefined,
        content: "",
    }
    this.state = "unset";
    if (args === undefined) args = {};
    this.args = Object.assign(defaultArgs, args);
    //find anchor
    this.anchor = this.args.anchor;
    if (this.anchor === undefined || this.anchor === null) {
        this.state = "failed";
        return this;
    }
    //create new tooltip
    let ttHtml = document.createElement("div");
    ttHtml.id = "tt"+Date.now();
    ttHtml.className = "mdc-tooltip";
    ttHtml.setAttribute("role", "tooltip");
    ttHtml.ariaHidden = "true";
    let inner = document.createElement("div");
    inner.className = "mdc-tooltip__surface mdc-tooltip__surface-animation";
    inner.innerHTML = this.args.content;
    ttHtml.append(inner);

    document.body.append(ttHtml);
    this.anchor.setAttribute("aria-describedby", ttHtml.id);
    this.mdcTooltip = new MDCTooltip(ttHtml);
    this.ttHtml = ttHtml;
    this.setContent = function(content){
        if (typeof(content) === "string"){
            inner.innerHTML = content;
            return true;
        }
        else return false;
    }
    this.state = "active";
    return this;

}

/**
 *
 * generates a new contentHandler object
 *
 * @param type {String}
 * @param handlerFunction {Function}
 * @param handlerArgs {Object}
 * @param handlerArgs.callback {Object}
 * @param handlerArgs.callback.onSave {Function}
 * @param handlerArgs.callback.onLoad {Function}
 * @constructor
 */
var ContentHandler = function(type, handlerFunction, handlerArgs) {
    this.type = type;
    this.fn = handlerFunction;
    this.inputs = [];
    if (handlerArgs === undefined) handlerArgs = {};
    let defaultArgs = {
        callback: {
            onSave: function(){
                let handlerContent = []; //contains key-val pairs (id, value, inputType)
                let inputs = document.querySelectorAll(".sidebar input");
                inputs.forEach(el => {
                    let type = el.type;
                    let value;
                    switch(type){
                        case "checkbox":
                            value = el.checked;
                            break;
                        case "date":
                            value = el.value;
                            break;
                        default:
                            value = el.value;
                            break;
                    }
                    handlerContent.push({
                        id: el.id,
                        value: value,
                        type: type,
                    })
                })
                return handlerContent;
            },
            onLoad: function(handlerContent){
                handlerContent.forEach(entry => {
                    let el = document.getElementById(entry.id);
                    if (el === undefined || el === null) {

                    }
                    else {
                        let type = entry.type;
                        let value = entry.value;
                        switch(type){
                            case "checkbox":
                                el.checked = value;
                                break;
                            case "date":
                                el.value = value;
                                break;
                            default:
                                el.value = value;
                                break;
                        }
                    }
                })
            },
        }
    }
    this.args = Object.assign(defaultArgs, handlerArgs);
    this.apply = function(sidebar, args, type){
           return this.fn(sidebar, args, type);
    }
    this.save = function(){
        return this.args.callback.onSave();
    }
    this.load = function(handlerContent){
        return this.args.callback.onLoad(handlerContent);
    }
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
 * @param args.customHandler {Boolean} overwrite default function with custom handler.
 * @param args.handler {function} custom handler function. requires type "custom" or customHandler parameter set.
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
        customHandler: false,
        handler: function(){},
        enabled: true,
    }
    args = Object.assign(defaultArgs, args);
    this.sidebar = args.sidebar;
    this.selector = args.selector;
    this.type = args.type;
    this.customHandler = args.customHandler;
    this.handler = args.handler;
    this.enabled = args.enabled;

    if (this.selector === undefined) {
        console.error("Failed to create SidebarButton: No Selector")
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
        case "allowed":
            self.container.classList.add("sidebarButton--allowed");
            break;
        case "cancel":
            self.container.classList.add("sidebarButton--cancel");
            self.handler = function(self){
                self.sidebar.showDefault((phone.matches || tablet.matches))
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
    if(self.customHandler){
        //overwrite default handler, if any is set
        self.handler = args.handler;
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

SidebarButton.prototype.disable = function(disable){
    if(disable === undefined) disable = true;
    if(disable) {
        this.container.classList.add("sidebarButton-disabled");
        this.button.disabled = true;
        this.enabled = false;
    }
}


SidebarButton.prototype.enable = function(enable){
    if(enable === undefined) enable = true;
    if(enable) {
        this.container.classList.remove("sidebarButton-disabled");
        this.button.disabled = false;
        this.enabled = true;
    }
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

    return new Promise(function(resolve, reject) {
        //look for handler
        let handler = self.contentHandlers.find(handler => handler.type === type);
        if (handler === undefined) {
            console.error("Sidebar error: No handler found for given content type: " + type);
            reject();
        }
        else {
            self.currentPage.handler = handler;
            handler.apply(self, args, type)
                .then(result => {
                    resolve(result)
                })
        }
    });

};

/**
 * displays a sidebar page as overlay. saves the current sidebar state and returns to it on completion
 * @param type
 * @param args
 */
Sidebar.prototype.addSubpage = function(type, args) {
    let storageObject = this.saveContent();
    this.addContent(type, args);
    return storageObject;
}

Sidebar.prototype.saveContent = function() {
    //save temporary input contents. We use the handlers onSave callback.
    let handler = this.currentPage.handler;
    let handlerContent = handler.save();
    //return content
    //create storage id
    let storageObject = {page: this.currentPage, handler: handler, handlerContent: handlerContent}
    return storageObject;
}

Sidebar.prototype.loadContent = function(storageObject) {
    let handler = storageObject.handler;
    let currentPage = storageObject.page;
    this.addContent(storageObject.page.type, storageObject.page.args)
        .then(result => {
            currentPage.handler.load(storageObject.handlerContent)
        })
}

Sidebar.prototype.setDefault = function(type, args){
    this.defaultPage.type = type;
    this.defaultPage.args = args;
    this.hasDefault = true;
}

Sidebar.prototype.setCurrentDefault = function(){
    this.defaultPage.type = this.currentPage.type;
    this.defaultPage.args = this.currentPage.args;
    this.hasDefault = true;
}

/**
 * resets current input and shows the default sidebar element, if any is set. otherwise, the sidebar will go into hiding
 * @param hide
 */
Sidebar.prototype.showDefault = function(hide){
    if(hide === undefined) hide = false;
    //if default is unset, close sidebar
    if(!this.hasDefault) {
        this.resetCurrentPage();
        this.hide();
    }
    else {
        this.addContent(this.defaultPage.type, this.defaultPage.args);
        if(hide) this.hide();
    }

}

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
    var errorHtml = document.createElement("div");
    errorHtml.classList = c;
    errorHtml.innerHTML = msg;
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

/**
 *
 * @param selector {string} selector for button element. must be a native-js compatible selector string
 * @param args {Object} args object
 * @param {string} [args.type] - button type, used for styling and default handler. Default: "back"
 * @param {boolean} [args.customHandler] - true if a custom handler is provided. Default: false
 * @param {Function} [args.handler] - custom handler function. requires customHandler set to true.
 * @param {boolean} [args.enabled] - sets whether the button should be enabled initially. Default: true.
 * @returns {SidebarButton}
 */
Sidebar.prototype.registerBackButton = function(selector, args) {
    let self = this;
    let defaultArgs = {
        sidebar: self,
        selector: selector,
        type: "back",
        customHandler: false,
        handler: function(){
            self.toggle()
        },
        enabled: true,
    }
    let constructorArgs = Object.assign(defaultArgs, args);
    return new SidebarButton(constructorArgs);
}

/**
 *
 * @param selector {string} selector for button element. must be a native-js compatible selector string
 * @param args {Object} args object
 * @param {string} [args.type] - button type, used for styling and default handler. Default: "reset"
 * @param {boolean} [args.customHandler] - true if a custom handler is provided. Default: false
 * @param {Function} [args.handler] - custom handler function. requires customHandler set to true.
 * @param {boolean} [args.enabled] - sets whether the button should be enabled initially. Default: true.
 * @returns {SidebarButton}
 */
Sidebar.prototype.registerResetButton = function(selector, args) {
    let self = this;
    let defaultArgs = {
        sidebar: self,
        selector: selector,
        type: "reset",
        customHandler: false,
        handler: function(){},
        enabled: true,
    }
    let constructorArgs = Object.assign(defaultArgs, args);
    return new SidebarButton(constructorArgs)
}

/**
 *
 * @param selector {string} selector for button element. must be a native-js compatible selector string
 * @param args {Object} args object
 * @param {string} [args.type] - button type, used for styling and default handler. Default: "cancel"
 * @param {boolean} [args.customHandler] - true if a custom handler is provided. Default: false
 * @param {Function} [args.handler] - custom handler function. requires customHandler set to true.
 * @param {boolean} [args.enabled] - sets whether the button should be enabled initially. Default: true.
 * @returns {SidebarButton}
 */
Sidebar.prototype.registerCancelButton = function(selector, args) {
    let self = this;
    let defaultArgs = {
        sidebar: self,
        selector: selector,
        type: "cancel",
        customHandler: false,
        handler: function(){},
        enabled: true,
    }
    let constructorArgs = Object.assign(defaultArgs, args)
    return new SidebarButton(constructorArgs)
}

/**
 *
 * @param selector {string} selector for button element. must be a native-js compatible selector string
 * @param args {Object} args object
 * @param {string} [args.type] - button type, used for styling and default handler. Default: "confirm"
 * @param {boolean} [args.customHandler] - true if a custom handler is provided. Default: true
 * @param {Function} args.handler - custom handler function. confirm buttons do not provide default handlers, so this should be set.
 * @param {boolean} [args.enabled] - sets whether the button should be enabled initially. Default: true.
 * @returns {SidebarButton}
 */
Sidebar.prototype.registerConfirmButton = function(selector, args) {
    let self = this;
    let defaultArgs = {
        sidebar: self,
        selector: selector,
        type: "confirm",
        customHandler: true,
        handler: function(){},
        enabled: true,
    }
    let constructorArgs = Object.assign(defaultArgs, args)
    return new SidebarButton(constructorArgs)
}

/**
 *
 * @param selector {string} selector for button element. must be a native-js compatible selector string
 * @param args {Object} args object
 * @param {string} [args.type] - button type, used for styling and default handler. Default: "delete"
 * @param {boolean} [args.customHandler] - true if a custom handler is provided. Default: true
 * @param {Function} [args.handler] - custom handler function. requires customHandler set to true.
 * @param {boolean} [args.enabled] - sets whether the button should be enabled initially. Default: true.
 * @returns {SidebarButton}
 */
Sidebar.prototype.registerDeleteButton = function(selector, args) {
    let self = this;
    let defaultArgs = {
        sidebar: self,
        selector: selector,
        type: "delete",
        customHandler: true,
        handler: function(){},
        enabled: true,
    }
    let constructorArgs = Object.assign(defaultArgs, args)
    return new SidebarButton(constructorArgs)
}

/**
 *
 * @param selector {string} selector for button element. must be a native-js compatible selector string
 * @param args {Object} args object
 * @param {string} [args.type] - button type, used for styling and default handler. Default: "delete"
 * @param {boolean} [args.customHandler] - true if a custom handler is provided. Default: true
 * @param {Function} [args.handler] - custom handler function. requires customHandler set to true.
 * @param {boolean} [args.enabled] - sets whether the button should be enabled initially. Default: true.
 * @returns {SidebarButton}
 */
Sidebar.prototype.registerButton = function(selector, args) {
    let self = this;
    let defaultArgs = {
        sidebar: self,
        selector: selector,
        type: "custom",
        customHandler: true,
        handler: function(){},
        enabled: true,
    }
    let constructorArgs = Object.assign(defaultArgs, args)
    return new SidebarButton(constructorArgs)
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
Sidebar helpers public
 */

Sidebar.prototype.findQualByIdInTypeArray = function(byTypeArr, qualId){
    return findQualByIdInTypeArray(byTypeArr, qualId);
}

Sidebar.prototype.populateCurrentQualificationDefault = function(self, doc, current, args){
    return populateCurrentQualificationDefault(self,doc,current,args);
}
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

export {Sidebar, SidebarPlugin, ContentHandler, SidebarButton, SidebarTooltip}