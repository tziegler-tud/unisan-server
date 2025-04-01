import Sidebar from "../sidebar/Sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
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
import ComponentPage from "../components/ComponentPage";
import {UserProfile} from "../userprofile/userprofile";
import {EventRequest} from "../events/eventRequest";
import PageModule from "../utils/PageModule";

export default new PageModule({
    title: "settings.notifications",
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
    },

});

