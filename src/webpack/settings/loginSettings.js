import Sidebar from "../sidebar/Sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {Snackbar} from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import ComponentPage from "../components/ComponentPage";
import {UserProfile} from "../userprofile/userprofile";
import PageModule from "../utils/PageModule";

export default new PageModule({
    title: "settings.login",
    pageData: {},
    init: async function (args) {
        this.pageData = {};
        var lidlRTO = window.lidlRTO;

        window.snackbar = new Snackbar();

        var userProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);

        let self  = this;
        var ob1 = new lidlObserver(function (u) {
            self.pageData.user = u;
            self.updatePage(self.pageData.user, args)
        });
        window.snackbar = new Snackbar();
        // get user data from user service
        window.userProfile = userProfile;
        this.pageData.user = await userProfile.getUserAndSubscribe(ob1);
        return {args, data: this.pageData};
    },
    buildPage: async function({args={}, data={}}={}) {
        var sidebar = new Sidebar('wrapper', {title: "Test"});
        sidebar.addPlugin(userPlugin);

        let pageContainer = document.getElementById("componentPage-component-container");
        var componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: sidebar,
            data: {user: user},
            args: {},
        });
        window.componentPage = componentPage;
        await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.PASSWORD, componentArgs: {allowEdit: true, size: "full", order: 2}, data: {user: user, targetUser: user, requirePassword: true}});
        await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.CONNECTEDSERVICES, componentArgs: {allowEdit: true, size: "full", order: 3}, data: {}});
    },
});

