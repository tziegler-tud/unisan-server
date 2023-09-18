import {Sidebar} from "../sidebar/sidebar";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {phone, tablet} from "../helpers/variables";
import {eventPlugin} from "../sidebar/plugins/plugin-event";
import {DashPage} from "./dashboardPage";
import {UserProfile} from "../userprofile/userprofile";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {Snackbar} from "../helpers/snackbar";
import {EventRequest} from "../events/eventRequest";
import "../helpers/handlebarsHelpers";

import "./dash.scss";
import ComponentPage from "../components/ComponentPage";


let news = {
    title: "news",
    pageData: {},
    init: function (args) {
        let self  = this;
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: dashboard."+self.title);

            self.pageData = {};
            var lidlRTO = window.lidlRTO;
            var user;
            var userProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);

            // create new observer
            var ob1 = new lidlObserver(function (u) {
                user = u;
                self.pageData.user = user;
                self.updatePage(self.pageData.user, args)
            });
            window.snackbar = new Snackbar();

            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            let userPromise = userProfile.getUserAndSubscribe(ob1);

            window.userProfile = userProfile;

            userPromise.then(user=> {
                self.pageData.user = user;
                self.buildPage(self.pageData.user, args);
            })
                .catch(function (reason) {
                    console.error("Failed to retrieve data:" + reason)
                })

        })
    },
    buildPage: function(user, args) {
        let self = this;
        var lidlRTO = window.lidlRTO;

        var sidebar = new Sidebar('wrapper', {title: "test"});
        sidebar.addPlugin(userPlugin);

        sidebar.addContent("user", {
            userid: self.pageData.user.id,
        });
        if(phone.matches || tablet.matches) {
            sidebar.hide();
        }
        else {
            sidebar.show();
        }

        let pageContainer = document.getElementById("componentPage-component-container");
        var componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: sidebar,
            data: {user: user, acl: window.dockerAcl},
            args: {},
        });
        window.componentPage = componentPage;

        componentPage.addComponent(ComponentPage.componentTypes.DASHBOARD.NEWS, {size: "full", order: 1});


        //
        // componentPage.addComponent(ComponentPage.componentTypes.SETTINGS.GENERAL, {size: "full", order: 1});
        // componentPage.addComponent(ComponentPage.componentTypes.SETTINGS.PASSWORD, {allowEdit: true, size: "full", order: 2}, {user: user, targetUser: "current"});
        // componentPage.addComponent(ComponentPage.componentTypes.SETTINGS.CONNECTEDSERVICES, {allowEdit: true, size: "full", order: 3});
    },
    updatePage: function(user, args){
        this.buildPage(user, args)
    }
};

export {news}