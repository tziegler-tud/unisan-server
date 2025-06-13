import { UserProfile } from "../userprofile/userprofile";
import { DropdownMenu } from "../helpers/dropdownMenu";
import { dateFromNow } from "../helpers/helpers";
import Snackbar from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import PageModule from "../utils/PageModule";
import Sidebar from "../sidebar/Sidebar";
import { userPlugin } from "../sidebar/plugins/plugin-user";
import ComponentPage, { ComponentPageOptions } from "../components/ComponentPage";
import {eventPlugin} from "../sidebar/plugins/plugin-event";
import pluginCalendar from "../sidebar/plugins/plugin-calendar";
import aclActions from "../actions/aclActions";

interface PageData {
    user?: any; // Replace 'any' with the actual type of user data
    targetUser?: any; // Replace 'any' with the actual type of target user data
}

interface InitArgs {
    // Define any arguments expected by the init function
}

interface BuildPageArgs {
    args?: any; // Replace 'any' with the specific type if known
    data?: PageData;
}

interface PageModuleArgs {
    title: string;
    pageData: PageData;
    init: (args: InitArgs) => Promise<{ args: InitArgs; data: PageData }>;
    buildPage: (buildPageArgs?: BuildPageArgs) => Promise<void>;
}

interface LidlObserver {
    (user: any): void; // Replace 'any' with the actual type of user data
}

export default new PageModule({
    title: "eventFactory.overview",
    pageData: {},
    init: async function (args: InitArgs): Promise<{ args: InitArgs; data: PageData }> {
        // @ts-ignore
        const currentUserProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);
        // create new observer
        const ob1: LidlObserver = (u) => {
            this.pageData.user = u;
        };
        // @ts-ignore
        window.snackbar = new Snackbar();

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

        // get user data from user service
        //subscribe as observer to get notification if user changes on server
        const currentUser = await currentUserProfile.getUserAndSubscribe(ob1);

        const data: PageData = {
            user: currentUser,
        };
        return { args, data };
    },
    buildPage: async function ({ args = {}, data = {} }: BuildPageArgs = {}): Promise<void> {
        let self = this;

        const sidebar = new Sidebar("wrapper");
        sidebar.addPlugin(eventPlugin);

        let dockerACL = undefined;
        let allowCreateEvent = false;
        try {
            dockerACL = await aclActions.getCurrentUserDockerAcl();
            allowCreateEvent = dockerACL.events.create;
        }
        catch(e) {
            console.error("Failed to get user acl. This might lead to incorrect display")
        }

        const pageContainer = document.getElementById("userPage-component-container");
        const componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: sidebar,
            data: data,
            args: {},
        });
        componentPage.addSection({ identifier: "LIST", order: 2, title: "Liste", displayMode: "hidden", disableMargins: true, disableComponentMargins: true });

        await componentPage.addComponent({
            componentType: ComponentPage.componentTypes.EVENTFACOTRY.LIST,
            componentArgs: { allowEdit: true, size: "full" },
            section: "LIST",
            data: { user: data.user, allowCreateEvent},
        });
    },
} as PageModuleArgs);