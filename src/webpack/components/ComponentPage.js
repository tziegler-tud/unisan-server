// factory for building html elements
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

import "./scss/componentPage.scss";
import PasswordComponent from "./PasswordComponent";
import GeneralSettingsComponent from "./GeneralSettingsComponent";
import ConnectedServicesComponent from "./ConnectedServicesComponent";
import OpenIdSettingsComponent from "./OpenIdSettingsComponent";
import MemberCreationComponent from "./componentPageModules/MemberCreationComponent";
import InteractiveListComponent from "./interactiveList";
import NewsComponent from "./pageComponents/dashboard/newsComponent";
import CreateNewsComponent from "./pageComponents/news/createNewsComponent";
import EditNewsComponent from "./pageComponents/news/editNewsComponent";

/**
 * generic component page Object
 * @param args
 * @param args.container {HTMLElement} container element for the page
 * @param args.data {Object} data to be available inside user page object
 * @param args.sidebar {Sidebar} sidebar object
 * @param args.snackbar {Snackbar} snackbar object
 * @param args.args {Object} additional args
 * @returns {ComponentPage}
 * @constructor
 */
export default class ComponentPage {
    /**
     *
     * @type {{GENERIC: string, SETTINGS: {PASSWORD: string}}}
     */
    static componentTypes = {
        DASHBOARD: {
            NEWS:               "dashboard.news",
        },
        NEWS: {
            ADD:                "news.add",
            EDIT:               "news.edit",
        },
        SETTINGS: {
            GENERAL:            "settings.general",
            PASSWORD:           "settings.password",
            CONNECTEDSERVICES:  "settings.connectedServices",
        },
        SYSTEM: {
            OPENID:             "system.openid",
            MEMBER_CREATION:    "system.memberCreation",
        },
        GENERIC:            "generic",
    };

    constructor({container=null, data={}, sidebar=null, snackbar=window.snackbar, args={}}={}) {

        this.data = data;
        this.container = container;

        /** @type {Sidebar} **/
        this.sidebar = sidebar;

        /** @type {Snackbar} **/
        this.snackbar = snackbar;

        this.components = [];
        this.componentContainer = this.container;
        this.user = data.user;

        this.componentCounter = {
            current: 0,
            next: function () {
                this.current++
                return this.current;
            }
        }
    }

    renderComponentHtml(html){
        let self = this;
        return new Promise(function(resolve, reject){
            self.componentContainer.append(html);
            let result = {
                error: false,
            }
            resolve(result);
        })
    }

    /**
     *
     * @param componentType
     * @param args
     * @param data
     * @returns {Promise<void>}
     */
    addComponent(componentType, args, data) {
        let componentId = this.componentCounter.next();
        let component;
        switch(componentType){
            case ComponentPage.componentTypes.DASHBOARD.NEWS:
                component = new NewsComponent({page: this, componentId: componentId, componentType: componentType, pageData: this.data, data: data, args: args});
                break;
            case ComponentPage.componentTypes.NEWS.ADD:
                component = new CreateNewsComponent({page: this, componentId: componentId, componentType: componentType, pageData: this.data, data: data, args: args});
                break;
            case ComponentPage.componentTypes. NEWS.EDIT:
                component = new EditNewsComponent({page: this, componentId: componentId, componentType: componentType, pageData: this.data, data: data, args: args});
                break;
            case ComponentPage.componentTypes.SETTINGS.PASSWORD:
                component = new PasswordComponent({page: this, componentId: componentId, componentType: componentType, pageData: this.data, data: data, args: args});
                break;
            case ComponentPage.componentTypes.SETTINGS.GENERAL:
                component = new GeneralSettingsComponent({page: this, componentId: componentId, componentType: componentType, pageData: this.data, data: data, args: args});
                break;
            case ComponentPage.componentTypes.SETTINGS.CONNECTEDSERVICES:
                component = new ConnectedServicesComponent({page: this, componentId: componentId, componentType: componentType, pageData: this.data, data: data, args: args});
                break;
            case ComponentPage.componentTypes.SYSTEM.OPENID:
                component = new OpenIdSettingsComponent({page: this, componentId: componentId, componentType: componentType, pageData: this.data, data: data, args: args});
                break;
            case ComponentPage.componentTypes.SYSTEM.MEMBER_CREATION:
                component = new MemberCreationComponent({page: this, componentId: componentId, componentType: componentType, pageData: this.data, data: data, args: args});
                break;
        }
        return this.addInternal(component)
    }

    async addInternal(component) {
        this.components.push(component);
        await component.renderComponent();
    }
}
