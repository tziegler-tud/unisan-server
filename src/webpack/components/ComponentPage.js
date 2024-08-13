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
import ComponentSection from "./ComponentSection";

export default class ComponentPage {

    /**
     *
     * @type {{SYSTEM: {OPENID: OpenIdSettingsComponent, MAIL: MailSettingsComponent, MEMBER_CREATION: MemberCreationComponent}, DASHBOARD: {NEWS: NewsComponent}, NEWS: {ADD: CreateNewsComponent, EDIT: EditNewsComponent}, SETTINGS: {CONNECTEDSERVICES: ConnectedServicesComponent, PASSWORD: PasswordComponent, USER_MAIL_DEV: UserMailDevComponent, USER_MAIL_PASSWORD: UserMailSettingsComponent, GENERAL: GeneralSettingsComponent, USER_MAIL: UserMailSettingsComponent}}}
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

        this.sections = []
        this.components = [];
        this.sectionContainer = undefined;
        this._prepareContainer();

        this.defaultSectionIdentifier = "default"
        this.defaultSection = this.createSection({identifier: this.defaultSectionIdentifier});

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

    _prepareContainer(){
        this.container.classList.add("componentPage-container");
        this.sectionContainer = document.createElement("div")
        this.sectionContainer.classList.add("componentPage-sectionContainer");
        this.container.appendChild(this.sectionContainer)
    }

    renderSectionHtml(html){
        this.sectionContainer.append(html);
        return {
            error: false,
        }
    }

    renderComponentHtml(section, html){
        section.componentContainer.append(html);
        return {
            error: false,
        }
    }

    /**
     * @param componentType
     * @param section {String}
     * @param componentArgs {Object}
     * @param data {Object}
     * @returns {Promise<void>}
     */
    addComponent({componentType, section = this.defaultSectionIdentifier, componentArgs, data}) {
        const args = Object.assign(this.args, componentArgs)
        let componentId = this.componentCounter.next();
        let sec = this.findSection(section)
        if(sec === undefined) {
            this.createSection({identifier: section})
        }
        /**
         * @type Component
         */
        let component = new componentType({page: this, section: sec, componentId: componentId,  pageData: this.data, data: data, args: args});
        return this.addInternal(sec, component)
    }

    /**
     *
     * @param section {ComponentSection}
     * @param component {Component}
     * @returns {Promise<void>}
     */
    async addInternal(section, component) {
        section.addComponent(component);
        await component.renderComponent();
    }


    /**
     *
     * @param sectionIdentifier
     * @param order
     * @param title
     * @param displayMode
     * @param disableComponentMargins
     * @returns {ComponentSection}
     */
    addSection({sectionIdentifier, order, title, displayMode, disableComponentMargins}){
        return this.createSection({identifier: sectionIdentifier, order: order, title: title, displayMode, disableComponentMargins})

    }

    /**
     *
     * @param componentPage
     * @param identifier
     * @param order
     * @param title
     * @param displayMode
     * @param disableComponentMargins
     * @returns {ComponentSection}
     */
    createSection({identifier, order, title, displayMode, disableComponentMargins}){
        const section = new ComponentSection({componentPage: this, identifier, order, title, displayMode, disableComponentMargins});
        this.sections.push(section)
        section.render();
        return section;
    }

    /**
     * @param sectionIdentifier {String}
     * @returns {ComponentSection | undefined}
     */
    findSection(sectionIdentifier){
        return this.sections.find(section => section.identifier === sectionIdentifier);
    }

    /**
     * @returns {[ComponentSection]}
     */
    getSections(){
        return this.sections;
    }
}
