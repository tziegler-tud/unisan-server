// factory for building html elements related to user pages
import {EditableTextField} from "../helpers/editableTextField";
import EditableInputField from "../helpers/editableInputField";
import {userActions, eventActions, groupActions} from "../actions/actions"
import Handlebars from "handlebars";
import * as FilePond from "filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginGetFile from "filepond-plugin-get-file";
import {MDCList} from "@material/list";
import {MDCRipple} from "@material/ripple";
import {MDCMenu} from "@material/menu";
import {MDCTextField} from "@material/textfield";
import {MDCTextFieldHelperText} from "@material/textfield/helper-text";

/**
 * user page Object
 * @param args
 * @param args.container {HTMLElement} container element for the page
 * @param args.data {Object} data to be available inside user page object
 * @param args.sidebar {Sidebar} sidebar object
 * @param args.snackbar {Snackbar} snackbar object
 * @param args.args {Object} additional args
 * @returns {UserPage}
 * @constructor
 */
var UserPage = function(args){
    let defaults = {
        container: null,
        data: null,
        sidebar: null,
        snackbar: window.snackbar,
        args: {

        }
    }
    args = (args === undefined) ? {}: args;
    args = Object.assign(defaults, args);

    this.data = args.data;
    this.container = args.container;

    /** @type {Sidebar} **/
    this.sidebar = args.sidebar;

    /** @type {Snackbar} **/
    this.snackbar = args.snackbar;

    if(args.data.user === undefined) this.data.user = {}
    this.user = this.data.user;
    this.components = [];
    this.componentContainer = this.container;
    //constructor
    return this;
};

UserPage.prototype.componentCounter = {
    current: 0,
    next: function(){
        this.current++
        return this.current;
    }
}

UserPage.prototype.addComponent = function(componentType, args){
    let self = this;
    let componentId = this.componentCounter.next();
    let component = new Component(self, componentId, componentType, self.data, args);
    this.components.push(component);
    this.componentContainer.append(component.getHtml());
};

/**
 *
 * @param page {UserPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {UserPage.componentTypes} type of the component
 * @param data {Object}
 * @param args {Object}
 * @returns {Component}
 * @constructor
 */
var Component = function(page, componentId, componentType, data, args){
    let self = this;
    let defaults = {
        allowEdit: true,
        size: "full",
        classes: "",
        order: componentId,
        handlers: [],

    }
    args = (args === undefined) ? {}: args;
    this.args = Object.assign(defaults, args);
    this.page = page;
    this.user = data.user;
    this.componentId = componentId;
    this.container = document.createElement("div");
    this.container.classList.add("userPage-component-wrapper");
    switch (this.args.size) {
        case "full":
            this.container.classList.add("userPage-component-wrapper--full")
            break;
        case "half":
            this.container.classList.add("userPage-component-wrapper--half");
            break;
    }
    this.container.style.order = args.order;
    this.html = this.container;

    this.init = new Promise(function(resolve, reject){
        var templateUrl ="";
        var template;
        let handleData = data;
        handleData.args = {
            allowEdit: self.args.allowEdit,
        };

        switch(componentType) {
            case (UserPage.componentTypes.SETTINGS.PASSWORD):
                //build date and location module
                templateUrl = "/webpack/userpage/pageModules/settings/userSettingsPassword.hbs";
                $.get(templateUrl, function (templateData) {
                    template = Handlebars.compile(templateData);
                    self.container.innerHTML = template(handleData);

                    //add sidebar hook
                    const buttonList = document.getElementsByClassName("changePasswordButton");
                    if(buttonList.length > 0) {
                        for (let button of buttonList) {
                            button.addEventListener("click", function (event) {
                                if(self.page.sidebar){
                                    self.page.sidebar.addContent("UserChangePassword", {
                                        userid: self.user.id,
                                        callback: {
                                            onConfirm: function (userid, data) {
                                                console.log("userid: " + userid);
                                                console.log("current: " + data.current);
                                                console.log("pw: " + data.pw);
                                                console.log("check: " + data.check);

                                                let action = userActions.updateCurrentUserPassword(userid, data.current, data.pw, {})
                                                    .done(result => {
                                                        if(self.page.snackbar) {
                                                            self.page.snackbar.show("Passwort erfolgreich aktualisiert", {});
                                                        }
                                                        self.page.sidebar.hide();
                                                    })
                                                    .fail(result => {
                                                        if(self.page.snackbar) {
                                                            self.page.snackbar.show("Fehler: Aktuelles Passwort ist nicht korrekt.", {
                                                                actionButton: {
                                                                    display: true,
                                                                    text: "Okay."
                                                                },
                                                                closeOnEscape: true,
                                                            });
                                                        }

                                                    })
                                                    .catch(err => {

                                                    })
                                                console.log(action)
                                            }
                                        }
                                    })
                                    self.page.sidebar.show();
                                }
                            })
                        }
                    }
                    // const currentPwField = new MDCTextField(document.querySelector('#passwordCurrent'));

                    self.args.handlers.forEach(function(handler){
                        handler(self);
                    })
                });
                break;
            case (UserPage.componentTypes.GENERIC):
                //Create empty module
                break;
        }
        resolve();
    })
    return self;
};

Component.prototype.getHtml = function(){
    return this.html;
}


/**
 *
 * @type {{GENERIC: string, SETTINGS: {PASSWORD: string}}}
 */
UserPage.componentTypes = {
    SETTINGS: {
        PASSWORD:      "1",
    },
    GENERIC:       "0",
};

export{UserPage}
