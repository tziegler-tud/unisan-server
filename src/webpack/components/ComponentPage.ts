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
import ComponentSection, {ComponentSectionOptions} from "./ComponentSection";
import UserEventsComponent from "./pageComponents/user/UserEventsComponent";
import CalendarComponent from "./pageComponents/events/CalendarComponent";

import Snackbar from "../helpers/snackbar"

import Component, {ComponentOptionArgs} from "./Component";
import Sidebar from "../sidebar/Sidebar";

export interface ComponentPageOptions {
    container?: HTMLElement;
    data?: any;
    sidebar?: any;
    snackbar?: any;
    args?: any;
}

export interface AddComponentOptions {
    componentType: typeof Component;
    section?: string;
    componentArgs?: ComponentOptionArgs
    data?: any;
}

export default class ComponentPage {
    static componentTypes = {
        DASHBOARD: {
            NEWS: NewsComponent,
        },
        NEWS: {
            ADD: CreateNewsComponent,
            EDIT: EditNewsComponent,
        },
        SETTINGS: {
            GENERAL: GeneralSettingsComponent,
            PASSWORD: PasswordComponent,
            USER_MAIL: UserMailSettingsComponent,
            USER_MAIL_PASSWORD: UserMailPasswordComponent,
            USER_MAIL_DEV: UserMailDevComponent,
            CONNECTEDSERVICES: ConnectedServicesComponent,
        },
        SYSTEM: {
            OPENID: OpenIdSettingsComponent,
            MEMBER_CREATION: MemberCreationComponent,
            MAIL: MailSettingsComponent,
        },
        USER: {
            EVENTS: UserEventsComponent,
        },
        EVENTS: {
            CALENDAR: CalendarComponent,
        },
    };

    private data: any;
    private container: HTMLElement;
    sidebar: Sidebar;
    snackbar: Snackbar;
    private sections: ComponentSection[];
    private components: Component[];
    private sectionContainer: HTMLElement;
    private defaultSectionIdentifier: string;
    private defaultSection: ComponentSection;
    private componentCounter: ComponentCounter;
    private options

    constructor(options: ComponentPageOptions = {}) {
        this.data = options.data || {};
        this.container = options.container;

        this.sidebar = options.sidebar ? options.sidebar : new Sidebar('wrapper');
        this.snackbar = options.snackbar ? options.snackbar : new Snackbar();

        this.sections = [];
        this.components = [];
        this.sectionContainer = undefined;
        this._prepareContainer();

        this.defaultSectionIdentifier = "default";
        this.defaultSection = this.createSection({ identifier: this.defaultSectionIdentifier });

        this.componentCounter = new ComponentCounter(0);

        this.options = options.args || {};
    }

    private _prepareContainer(): void {
        this.container.classList.add("componentPage-container");
        this.sectionContainer = document.createElement("div");
        this.sectionContainer.classList.add("componentPage-sectionContainer");
        this.container.appendChild(this.sectionContainer);
    }

    renderSectionHtml(html: HTMLElement): { error: false } {
        this.sectionContainer.appendChild(html);
        return { error: false };
    }

    renderComponentHtml(section: ComponentSection, html: HTMLElement): { error: false } {
        section.componentContainer.appendChild(html);
        return { error: false };
    }

    async addComponent(options: AddComponentOptions): Promise<void> {
        const args = { ...this.options, ...options.componentArgs };
        const componentId = this.componentCounter.next().toString();
        let section = this.findSection(options.section || this.defaultSectionIdentifier);

        if (!section) {
            section = this.createSection({
                identifier: options.section || this.defaultSectionIdentifier
            });
        }

        const component = new options.componentType({
            page: this,
            section,
            componentId,
            pageData: this.data,
            data: options.data,
            args,
        });

        await this.addInternal(section, component);
    }

    private async addInternal(section: ComponentSection, component: Component): Promise<void> {
        section.addComponent(component);
        await component.renderComponent();
    }

    addSection(options: ComponentSectionOptions): ComponentSection {
        return this.createSection(options);
    }

    createSection(options: ComponentSectionOptions): ComponentSection {
        const section = new ComponentSection(this, { ...options });
        this.sections.push(section);
        section.render();
        return section;
    }

    findSection(sectionIdentifier: string): ComponentSection | undefined {
        return this.sections.find(section => section.identifier === sectionIdentifier);
    }

    getSections(): ComponentSection[] {
        return [...this.sections];
    }
}

class ComponentCounter {
    current: number;

    constructor(initialValue: number = 0) {
        this.current = initialValue;
    }

    next(): number {
        this.current++;
        return this.current;
    }

}