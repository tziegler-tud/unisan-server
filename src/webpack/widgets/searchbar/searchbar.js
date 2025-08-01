import "./searchbar.scss";

import {MDCTextField} from '@material/textfield';
import {MDCRipple} from '@material/ripple';
import {MDCTextFieldIcon} from '@material/textfield/icon';
const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";

let searchbarCounter = {
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
 * constructor for Searchbar objects
 *
 * @param {HTMLElement} container - container dom element
 * @param {Object} searchbarArgs
 * @returns {Searchbar}
 * @constructor
 */

var Searchbar = function(container, searchbarArgs){

    this.count = searchbarCounter.next();
    this.id = "searchbar" + this.count;
    searchbarArgs = applyArgs(searchbarArgs);
    this.searchbarArgs = searchbarArgs;
    this.domElements = {};
    this.isactive = true;
    this.container = container;
    this.input = undefined;


    //build html
    let self = this;

    this.init = new Promise(function(resolve, reject){
            if (container === undefined || container === null) {
                let msg = "cannot instantiate search bar without container!";
                reject("Searchbar failed to initialize: " + msg)
            }
            else {
                var searchbarHTML = buildHTML(self);
                setupEventHandlers(self, searchbarHTML);
                //append to container
                let current = container.innerHTML;
                container.append(searchbarHTML);
                resolve();
            }
        })
    this.init.then(() => {
            if(self.searchbarArgs.hidden) self.hide();
            //successfully initialized
        })
        .catch(msg => {
            console.warn(msg);
        })
    return this;
};

var applyArgs = function(args){
    let defaultArgs = {
        hidden: true,
        label: "Suche:",
        noIcon: false,
        enableCollapse: true,
        classes: undefined,
        onInput: {
            enabled: false,
            callback: function(){},
        },
        onFocus: {
            enabled: false,
            callback: function(){}
        }
    }
    if (args===undefined) {
        return defaultArgs;
    }
    return Object.assign(defaultArgs, args);
};

var buildHTML = function(self){
    self.container.classList.add("searchbar-container");
    let id = self.id;
    let sb = document.createElement("div");
    sb.className = "searchbar";
    sb.id= id;
    // sb.innerHTML = '<label class="searchbar-label" for=' +id + '>Suche:</label><input id="searchbarInput'+ id +'" class="searchbar-input common-input"</input>'

    let icon = createIconButton(self);

    if(!self.searchbarArgs.noIcon) {
        self.container.append(icon);
    }

    // let label = document.createElement("label");
    // label.className = "searchbar-label";
    // label.htmlFor = id;
    // let s = "Suche:";
    // if(typeof(self.searchbarArgs.label) === "string"){
    //     s = self.searchbarArgs.label;
    // }
    // label.innerHTML = s;
    // if(!self.searchbarArgs.noLabel) {
    //     sb.append(label);
    // }

    // let input = document.createElement("input");
    // input.className = "searchbar-input common-input";
    // if(typeof(self.searchbarArgs.classes) === "string"){
    //     input.classList.add(self.searchbarArgs.classes)
    // }
    let input = createInput(self);
    input.id = "searchbarInput"+ self.count;
    self.input = input;
    sb.append(input);

    self.domElements.container = sb;
    self.domElements.icon = icon;
    // self.domElements.label = label;
    self.domElements.input = input;

    return sb;
};

var createIconButton = function(self){
    let icon = document.createElement("div");
    icon.id = "searchbar-icon" + self.count;
    icon.className = "mdc-touch-target-wrapper";
    let b = document.createElement("button");
    b.className = "mdc-icon-button mdc-icon-button--touch material-icons";
    let ripple = document.createElement("div");
    ripple.className = "mdc-icon-button__ripple";

    let touch = document.createElement("div");
    touch.className = "mdc-icon-button__touch"

    b.innerHTML = "search";

    b.prepend(ripple);
    b.append(touch);
    icon.append(b);
    let iconRipple = new MDCRipple(ripple);
    iconRipple.unbounded = true;
    return icon;
}

var createInput = function(self){
    let input = document.createElement("label");
    input.className = "mdc-text-field mdc-text-field--filled mdc-text-field--with-trailing-icon";
    let ripple = document.createElement("span");
    ripple.className = "mdc-text-field__ripple";

    let label = document.createElement("span");
    label.className = "mdc-floating-label";
    label.id="searchbarLabel"+self.count;

    let i = document.createElement("input");
    i.className = "mdc-text-field__input";
    i.type = "text";
    i.setAttribute("aria-labelledby", "searchbarLabel"+self.count);

    let trailingIcon = document.createElement("i");
    trailingIcon.className = "material-icons mdc-text-field__icon mdc-text-field__icon--trailing";
    trailingIcon.setAttribute("tabindex", "0");
    trailingIcon.role = "button";
    trailingIcon.innerHTML = "clear"

    let line = document.createElement("span");
    line.className = "mdc-line-ripple"

    label.innerHTML = self.searchbarArgs.label;

    input.append(ripple);
    input.append(label);
    input.append(i);
    input.append(trailingIcon);
    input.append(line);
    const textField = new MDCTextField(input);
    const mdcIcon = new MDCTextFieldIcon(trailingIcon);
    trailingIcon.addEventListener("click", function(){
        self.resetInput();
    })
    return input;
}

var setupEventHandlers = function(self, searchbarHTML){
    let inputElement = $(self.domElements.input).children("input");
    if (self.searchbarArgs.onInput.enabled) {
        inputElement.on("input",function(){
            self.searchbarArgs.onInput.callback(inputElement.val());
        })
    }
    if (self.searchbarArgs.onFocus.enabled) {
        inputElement.on("focus",function(){
            self.searchbarArgs.onFocus.callback(inputElement.val());
        })
    }

    if(self.searchbarArgs.enableCollapse){
        $(self.domElements.icon).on("click", function(){
            self.toggle();
        })
    }
};

/**
 * returns the native input element
 * @returns {HTMLInputElement || null} the native input element
 */
Searchbar.prototype.getInputElement = function(){
    let self = this;
    this.init
        .then(function(){
            return self.domElements.input;
        })
        .catch(err => {
            return null;
        })
};

/**
 *
 * returns true if the searchbar is active, i.e. not hidden
 * @returns {Boolean}
 */
Searchbar.prototype.isActive = function(){
    let self = this;
    this.init
        .then(function(){
            return self.isactive;
        })
        .catch(err => {
            return false;
        })

};

Searchbar.prototype.getValue = function(){
    let self = this;
    this.init
        .then(function(){
            return self.domElements.input.value;
        })
        .catch(err => {
            return null;
        })
}

Searchbar.prototype.resetInput = function(){
    let self = this;
    this.init
        .then(function(){
            let inputElement = $(self.domElements.input).children("input");
            $(inputElement).val("");
            if (self.searchbarArgs.onInput.enabled) {
                self.searchbarArgs.onInput.callback(inputElement.val());
            }
        })
        .catch(msg => {
            console.warn(msg);
        })

};


Searchbar.prototype.hide = function(){
    let self = this;
    this.init.then(function(){
        self.resetInput();
        // self.domElements.container.style.display = "none";
        self.container.classList.add("hidden");
        self.isactive = false;
    })
        .catch(msg => {
            console.warn(msg);
        })

}
Searchbar.prototype.show = function(){
    let self = this;
    this.init.then(function(){
        // self.domElements.container.style.display = "";
        self.container.classList.remove("hidden");
        self.isactive = true;
    })
        .catch(msg => {
            console.warn(msg);
        })
}

Searchbar.prototype.toggle = function(){
    let self = this;
    if (self.isactive) {
        self.hide()
    }
    else {
        self.show();
    }
}


export{Searchbar}