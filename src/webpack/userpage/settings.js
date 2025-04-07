import Sidebar from "../sidebar/Sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {UserProfile} from "../userprofile/userprofile";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {DropdownMenu} from "../helpers/dropdownMenu";
import {Snackbar} from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import ComponentPage from "../components/ComponentPage";
import PageModule from "../utils/PageModule";


export default new PageModule ({
        title: "user.settings",
        pageData: {},
        init: async function (args) {
            var lidlRTO = window.lidlRTO;

            var currentUserProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);

            var targetUserProfile = new UserProfile(window.exploreUserId);

            // create new observer
            var ob1 = new lidlObserver((u) => {
                this.pageData.user = u;
            });
            window.snackbar = new Snackbar();

            const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});


            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            const currentUser = await currentUserProfile.getUserAndSubscribe(ob1);
            const targetUser = await targetUserProfile.getUserAndSubscribe(ob1);


            const data = {
                user: currentUser,
                targetUser: targetUser
            }
            return {args, data}
    },
    buildPage: async function({args={}, data={}}={}) {
        let self = this;
        var lidlRTO = window.lidlRTO;

        var sidebar = new Sidebar('wrapper', {title: "Test"});
        sidebar.addPlugin(userPlugin);
        // init event sidebar
        // if(!(phone.matches || tablet.matches)) sidebar.show();

        let pageArgs = {

        };

        try {
            pageArgs.acl = await $.get("/api/v1/acl/current");
        }
        catch(e) {
            console.error("Failed to get user acl. This might lead to incorrect display")
        }

        if (window.allowedit) {
            window.DockerElement.addDockerSubPage("userEdit", data.targetUser, {}, undefined, {currentUser: {edit: window.allowedit}});
        }
        else {
            window.DockerElement.addDockerSubPage("user", data.targetUser, {}, undefined, {currentUser: {edit: window.allowedit}});
        }

        let pageContainer = document.getElementById("userPage-component-container");
        var componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: sidebar,
            data: data,
            args: pageArgs,
        });
        window.componentPage = componentPage;
        componentPage.addSection({sectionIdentifier: "PASSWORD", order: 1, title: "Login & Passwort", displayMode: "show", disableComponentMargins: false})
        await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.PASSWORD, section:"PASSWORD", componentArgs: {allowEdit: true, size: "full"}, data: {user: data.user, targetUser: data.targetUser, requirePassword: false}});

        componentPage.addSection({sectionIdentifier: "MAIL", order: 2, title: "Email-Einstellungen", displayMode: "show", disableComponentMargins: true})
        let allowSetInternalMail = false;
        if(pageArgs.acl.docker.system.mail || pageArgs.acl.docker.system.user) {
            allowSetInternalMail = true;
        }
        await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL, section:"MAIL", componentArgs: {allowEdit: true, allowEditCritical: allowSetInternalMail, size: "full", order: 1}, data: {user: data.user, targetUser: data.targetUser}});
        if(pageArgs.acl.docker.system.mail || pageArgs.acl.docker.system.user) {
            await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL_PASSWORD,  section:"MAIL", componentArgs: {allowEdit: true, size: "full", order: 1}, data: {user: data.user, targetUser: data.targetUser}});
        }
        if(pageArgs.acl.docker.system.mail){
            await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL_DEV, section:"MAIL", componentArgs: {allowEdit: true, size: "full", order: 1}, data: {user: data.user, targetUser: data.targetUser}});
        }
    },
});