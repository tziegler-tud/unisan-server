import "./sidebar.scss";
import "./sidebar-logs.scss";

import {phone, tablet} from "../helpers/variables";
import {refJSON} from "../helpers/helpers";
import {MDCTooltip} from "@material/tooltip";

import SidebarPlugin from "./SidebarPlugin"
import SidebarButton from "./SidebarButton";
import SidebarTooltip from "./SidebarTooltip";
import ContentHandler from "./ContentHandler";

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

export default class Sidebar{
    constructor(parentId, content, optionalId){
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
        this.sidebarHTML = $('<div/>', {
            id: this.domId,
            class: "sidebar-container",
        });
        this.parent.append(this.sidebarHTML);
        this.container = document.querySelector(".sidebar-container");;
    }

    addContentHandler (contentHandler) {
        this.contentHandlers.push(contentHandler);
    }

    /**
     *
     * @param {SidebarPlugin} sidebarPlugin
     * @returns {boolean} true if the plugin is available.
     */
    addPlugin (sidebarPlugin){
        //check if plugin was loaded
        if(!this.checkIfPluginIsLoaded(sidebarPlugin)){
            this.plugins.push(sidebarPlugin);
            let sidebar = this;
            sidebarPlugin.handlers.forEach(function(handler){
                sidebar.addContentHandler(handler);
            })
        }

        return true;
    }

    checkIfPluginIsLoaded(sidebarPlugin){
        return this.plugins.findIndex(plugin => plugin.name === sidebarPlugin.name) >= 0;
    }

    /***
     * adds content of a specific type
     * @param {String} type string denoting the type of content to be rendered
     * @param {Object} args args object. This is passed to subsequent methods.
     */
    addContent (type, args){
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
                let handlerResult = handler.apply(self, args, type) //this should return a promise. wrap if not
                if (handlerResult === undefined) {
                    handlerResult = new Promise(function(resolve, reject) {
                        resolve()
                    });
                }
                handlerResult.then(result => {
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
    addSubpage (type, args) {
        let storageObject = this.saveContent();
        this.addContent(type, args);
        return storageObject;
    }


    /**
     * saves the current sidebar content by using the save method of the associated content handler. returns a storage object containing the data, handler and page information.
     * use this together with loadContent method to temporarily store sidebar inputs and restore them later. Note that this is not persistent, i.e. cannot be used after page reload.
     * @returns {{handler: ContentHandler, handlerContent: {Object}, page: (*|{args: Object, type: String})}}
     */
    saveContent () {
        //save temporary input contents. We use the handlers onSave callback.
        let handler = this.currentPage.handler;
        let handlerContent = handler.save();
        //return content
        //create storage id
        let storageObject = {page: this.currentPage, handler: handler, handlerContent: handlerContent}
        return storageObject;
    }

    /**
     * loads a sidebar page and handler and fills it with previously stored data. use together with saveContent method.
     *
     * @param storageObject {{handler: ContentHandler, handlerContent: {Object}, page: (*|{args: Object, type: String})}}
     */
    loadContent (storageObject) {
        let handler = storageObject.handler;
        let currentPage = storageObject.page;
        this.addContent(storageObject.page.type, storageObject.page.args)
            .then(result => {
                currentPage.handler.load(storageObject.handlerContent)
            })
    }

    /**
     * sets a specific sidebar page as default.
     * @param type {String}
     * @param args {Object}
     */
    setDefault (type, args){
        this.defaultPage.type = type;
        this.defaultPage.args = args;
        this.hasDefault = true;
    }

    /**
     * sets the current sidebar page as default.
     */
    setCurrentDefault (){
        this.defaultPage.type = this.currentPage.type;
        this.defaultPage.args = this.currentPage.args;
        this.hasDefault = true;
    }

    /**
     * resets current input and shows the default sidebar element, if any is set. otherwise, the sidebar will go into hiding
     * @param hide
     */
    showDefault (hide){
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
    update (args){
        let newArgs = Object.assign(this.currentPage.args, args);
        this.addContent(this.currentPage.type, newArgs);
    }

    /**
     * toggles the sidebar activity state.
     */

    toggle (){

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
    show (){
        this.sidebarHTML.addClass("sidebar-active");
        this.parent.addClass("sidebar-active");
        document.body.classList.add("noscroll");

        this.isActive = true;
    };

    /**
     * hides the sidebar
     */
    hide (){
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
    addErrorMessage (msg, insertFunc, overwrite, warning) {

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
    /**
     *
     * @param selector
     */
    enableOptional (selector){
        $(selector).addClass("optional-enabled");
    };

    /**
     *
     * @param selector
     */
    disableOptional (selector){
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
    registerBackButton (selector, args={}) {
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
    registerResetButton (selector, args={}) {
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
    registerCancelButton (selector, args={}) {
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
    registerConfirmButton (selector, args={}) {
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
    registerDeleteButton (selector, args={}) {
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
    registerButton (selector, args={}) {
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


    getDataFromServer (url, callback) {
        $.ajax({
            url: url,
            type: 'GET',
            cache: false,
            isModified: false,
            data: {},
            success: callback,
        });
    }
    /*
    Sidebar helpers public
     */

    findQualByIdInTypeArray (byTypeArr, qualId){
        var localmatch;
        byTypeArr.forEach(function(qual){
            var match = qual.values.find(qualEntry => qualEntry._id === qualId);
            if (match != null) {
                localmatch = match;
            }
        });
        return localmatch;
    }

    populateCurrentQualificationDefault (self, doc, current, args){
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
    }

    createSelectDelimiter (classes){
        const delimiter = document.createElement('option');
        delimiter.innerHTML = "-----------------------";
        delimiter.disabled = true;
        return delimiter;
    }
    findExistingValues (doc, key){
        const val = refJSON(doc,key);
        if (val){
            // if key refers to array, do not find values.
            if (Array.isArray(val)) return undefined;
            else return val;
        }
        else return undefined;
    }

    /**
     *
     * @param currentQualification
     * @returns {boolean}
     */
    checkQualificationDataValidity (currentQualification){
        if(currentQualification == null) {
            return false;
        }
        else {
            if (currentQualification.qualType == null || currentQualification.name == null) {
                return false;
            }
        }
        return true;
    }


    /**
     *
     * @param field
     * @param dataset
     * @returns {Object}
     */
    checkDataValidity (field, dataset){
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
    }
    /**
     * resets all input on the current sidebar page.
     */
    resetCurrentPage (){
        this.addContent(this.currentPage.type, this.currentPage.args);
    }
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



