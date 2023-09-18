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



var actions = window.actions;


let dash = {
    title: "dash",
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

        let pageContainer = document.getElementById("dashPage-component-container");
        var dashPage = new DashPage({
            container: pageContainer,
            sidebar: sidebar,
            data: {user: user},
            args: {},
        });
        window.dashPage = dashPage;


        dashPage.addComponent(DashPage.componentTypes.EVENTPREVIEW,
            {
                size: "half",
            })
        dashPage.addComponent(DashPage.componentTypes.ACTIVITY,
            {
                size: "half",
                limitAmount: 9,
                minWidth: "30em"
            })
        dashPage.addComponent(DashPage.componentTypes.NEWS,
            {
                size: "full",
                limitAmount: 2,
            })
    },
    updatePage: function(user, args){
        this.buildPage(user, args)
    }
};


export {dash}