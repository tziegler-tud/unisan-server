import "./scss/componentPage.scss";
import PasswordComponent from "./PasswordComponent";
import GeneralSettingsComponent from "./GeneralSettingsComponent";
import ConnectedServicesComponent from "./ConnectedServicesComponent";
import OpenIdSettingsComponent from "./pageComponents/system/OpenIdSettingsComponent";
import MemberCreationComponent from "./componentPageModules/MemberCreationComponent";
import NewsComponent from "./pageComponents/dashboard/newsComponent";
import CreateNewsComponent from "./pageComponents/news/createNewsComponent";
import EditNewsComponent from "./pageComponents/news/editNewsComponent";
import UserMailSettingsComponent from "./pageComponents/settings/UserMailSettingsComponent";
import UserMailPasswordComponent from "./pageComponents/settings/UserMailPasswordComponent";
import UserMailDevComponent from "./pageComponents/settings/UserMailDevComponent";
import MailSettingsComponent from "./pageComponents/system/MailSettingsComponent";

export default class ComponentPage {
    /**
     *
     * @type {{GENERIC: string, SETTINGS: {PASSWORD: string}}}
     */
    static componentTypes = {
        DASHBOARD: {
            NEWS:               NewsComponent,
        },
        NEWS: {
            ADD:                CreateNewsComponent,
            EDIT:               EditNewsComponent,
        },
        SETTINGS: {
            GENERAL:            GeneralSettingsComponent,
            PASSWORD:           PasswordComponent,
            USER_MAIL:          UserMailSettingsComponent,
            USER_MAIL_PASSWORD:          UserMailPasswordComponent,
            USER_MAIL_DEV:          UserMailDevComponent,
            CONNECTEDSERVICES:  ConnectedServicesComponent,
        },
        SYSTEM: {
            OPENID:             OpenIdSettingsComponent,
            MEMBER_CREATION:    MemberCreationComponent,
            MAIL:               MailSettingsComponent,
        },
    };

    /**
     *
     * @param {HTMLElement} container
     * @param [Object={}] data
     * @param {Sidebar} sidebar
     * @param {Snackbar} snackbar
     * @param {Object} args
     */
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

        this.args = args;
    }

    renderComponentHtml(html){
        return new Promise((resolve, reject) => {
            this.componentContainer.append(html);
            let result = {
                error: false,
            }
            resolve(result);
        })
    }

    /**
     *
     * @param componentType
     * @param componentArgs
     * @param data
     * @returns {Promise<void>}
     */
    addComponent(componentType, componentArgs, data) {
        const args = Object.assign(this.args, componentArgs)
        let componentId = this.componentCounter.next();
        let component = new componentType({page: this, componentId: componentId,  pageData: this.data, data: data, args: args});
        return this.addInternal(component)
    }

    async addInternal(component) {
        this.components.push(component);
        await component.renderComponent();
    }
}
