import Sidebar from "../sidebar/Sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {UserProfile} from "../userprofile/userprofile";
import {UserPage} from "./userPage";

import {userActions, eventActions, groupActions} from "../actions/actions"

import {lidl} from "/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";

import {DropdownMenu} from "../helpers/dropdownMenu";
import {dateFromNow} from "../helpers/helpers";
import {phone, tablet} from "../helpers/variables";
import {Snackbar} from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import {EventPage} from "../events/eventPage";
import {eventPlugin} from "../sidebar/plugins/plugin-event";
import ComponentPage from "../components/ComponentPage";
import PageModule from "../utils/PageModule";

var actions = window.actions;


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

            var ob2 = new lidlObserver((u) => {
                this.pageData.targetUser = u;
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

        // let pageContainer = document.getElementById("userPage-component-container");
        // var userPage = new ComponentPage({
        //     container: pageContainer,
        //     sidebar: sidebar,
        //     data: {user: user},
        //     args: {},
        // });
        // window.userPage = userPage;
        // userPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.PASSWORD, {allowEdit: true, size: "full", targetUser: user.id}, {user: user, targetUser: user.id});

        let pageContainer = document.getElementById("userPage-component-container");
        var componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: sidebar,
            data: data,
            args: pageArgs,
        });
        window.componentPage = componentPage;
        componentPage.addSection({sectionIdentifier: "MAIL", order: 2, title: "Email-Einstellungen", displayMode: "show", disableComponentMargins: false})
        await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL, section:"MAIL", componentArgs: {allowEdit: true, size: "full", order: 1}, data: {user: data.user, targetUser: data.targetUser}});
        if(pageArgs.acl.docker.system.mail || pageArgs.acl.docker.system.user) {
            await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL_PASSWORD,  section:"MAIL", componentArgs: {allowEdit: true, size: "full", order: 1}, data: {user: data.user, targetUser: data.targetUser}});
        }
        if(pageArgs.acl.docker.system.mail){
            await componentPage.addComponent({componentType: ComponentPage.componentTypes.SETTINGS.USER_MAIL_DEV, componentArgs: {allowEdit: true, size: "full", order: 1}, data: {user: data.user, targetUser: data.targetUser}});
        }
    },
});