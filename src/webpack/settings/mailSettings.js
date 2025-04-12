import Sidebar from "../sidebar/Sidebar";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import Snackbar from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import ComponentPage from "../components/ComponentPage";
import {UserProfile} from "../userprofile/userprofile";
import PageModule from "../utils/PageModule";

export default new PageModule ({
    title: "settings.mail",
    pageData: {},
    init: async function (args) {
        this.pageData = {};
        window.snackbar = new Snackbar();
        var userProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);

        window.snackbar = new Snackbar();
        const self = this;
        var ob1 = new lidlObserver(function (u) {
            self.pageData.user = u;
            this.updatePage(self.pageData.user, args)
        });
        // get user data from user service
        window.userProfile = userProfile;
        this.pageData.user = await userProfile.getUserAndSubscribe(ob1);

        return {args, data: this.pageData};


    },
    buildPage: async function({args={}, data={}}={}) {
        const user = data.user;
        var lidlRTO = window.lidlRTO;

        var sidebar = new Sidebar('wrapper', {title: "Test"});
        sidebar.addPlugin(userPlugin);
        // init event sidebar
        // if(!(phone.matches || tablet.matches)) sidebar.show();

        let pageArgs = {

        };

        let pageData = {
            user: data.user,
        }

        try {
            pageArgs.acl = await $.get("/api/v1/acl/current");
        }
        catch(e) {
            console.error("Failed to get user acl. This might lead to incorrect display")
        }

        let pageContainer = document.getElementById("componentPage-component-container");
        var componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: sidebar,
            data: pageData,
            args: pageArgs,
        });
        componentPage.addSection({identifier: "MAIL", order: 0, title: "Email-Einstellungen", displayMode: "false", disableMargins: false, disableComponentMargins: false})
        await componentPage.addComponent({
            section: "MAIL",
            componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL,
            componentArgs: {allowEdit: true, size: "full", order: 1},
            data: {user: user, targetUser: user}
        });
        await componentPage.addComponent({
            section: "MAIL",
            componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL_PASSWORD,
            componentArgs: {allowEdit: true, size: "full", order: 2, delimiter: true},
            data: {user: user, targetUser: user}
        });
        if(pageArgs.acl.docker.system.mail){
            await componentPage.addComponent({
                section: "MAIL",
                componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL_DEV,
                componentArgs: {allowEdit: true, size: "full", order: 3, delimiter: true},
                data: {user: user, targetUser: user}
            });
        }
    },
});

