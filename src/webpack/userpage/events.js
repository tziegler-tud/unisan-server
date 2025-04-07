import {UserProfile} from "../userprofile/userprofile";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";

import {DropdownMenu} from "../helpers/dropdownMenu";
import {dateFromNow} from "../helpers/helpers";
import {Snackbar} from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import PageModule from "../utils/PageModule";
import Sidebar from "../sidebar/Sidebar";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import ComponentPage from "../components/ComponentPage";

var actions = window.actions;


export default new PageModule ({
    title: "user.events",
    pageData: {},
    init: async function (args) {
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

        let pageArgs = {};

        try {
            pageArgs.acl = await $.get("/api/v1/acl/current");
        } catch (e) {
            console.error("Failed to get user acl. This might lead to incorrect display")
        }

        if (window.allowedit) {
            window.DockerElement.addDockerSubPage("userEdit", data.targetUser, {}, undefined, {currentUser: {edit: window.allowedit}});
        } else {
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
        await componentPage.addComponent({
            componentType: ComponentPage.componentTypes.USER.EVENTS,
            componentArgs: {allowEdit: true, size: "full"},
            data: {user: data.user, targetUser: data.targetUser, requirePassword: false}
        });
    }
})
