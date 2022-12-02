import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {UserProfile} from "../userprofile/userprofile";
import {UserPage} from "./userPage";

import {userActions, eventActions, groupActions} from "../actions/actions"

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";

import {DropdownMenu} from "../helpers/dropdownMenu";
import {dateFromNow} from "../helpers/helpers";
import {phone, tablet} from "../helpers/variables";
import {Snackbar} from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import {EventPage} from "../events/eventPage";
import {eventPlugin} from "../sidebar/plugins/plugin-event";

var actions = window.actions;


let settings = {
    title: "settings",
    pageData: {},
    init: function (args) {
        let self  = this;
        self.initPromise = new Promise(function(resolve, reject){
            $(document).ready(function () {

                //debug line, remove before flight
                console.log("loading js module: user."+self.title);

                self.pageData = {};
                var lidlRTO = window.lidlRTO;
                var currentExploredUser;
                var profile = new UserProfile(window.exploreUserId);

                // create new observer
                var ob1 = new lidlObserver(function (u) {
                    currentExploredUser = u;
                    self.pageData.exploredUser = currentExploredUser;
                    self.updatePage(self.pageData.exploredUser, args)
                });
                window.snackbar = new Snackbar();

                const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});


                // get user data from user service
                //subscribe as observer to get notification if user changes on server
                let userPromise = profile.getUserAndSubscribe(ob1);

                userPromise.then(user=> {
                    self.pageData.exploredUser = user;
                    self.buildPage(self.pageData.exploredUser, args)
                        .then(result => {
                            resolve();
                        })
                        .catch(err=> {
                            reject(err)
                        })
                })
                    .catch(function (reason) {
                        console.error("Failed to retrieve data:" + reason)

                    })
            })
        })
    },
    buildPage: function(user, args) {
        let self = this;
        var lidlRTO = window.lidlRTO;

        var sidebar = new Sidebar('wrapper', {title: "Test"});
        sidebar.addPlugin(userPlugin);
        // init event sidebar
        // if(!(phone.matches || tablet.matches)) sidebar.show();


        return new Promise(function(resolve, reject){

            if (window.allowedit) {
                window.DockerElement.addDockerSubPage("userEdit", self.pageData.exploredUser, {}, undefined, {currentUser: {edit: window.allowedit}});
            }
            else {
                window.DockerElement.addDockerSubPage("user", self.pageData.exploredUser, {}, undefined, {currentUser: {edit: window.allowedit}});
            }

            let pageContainer = document.getElementById("userPage-component-container");
            var userPage = new UserPage({
                container: pageContainer,
                sidebar: sidebar,
                data: {user: user},
                args: {},
            });
            window.userPage = userPage;
            userPage.addComponent(UserPage.componentTypes.SETTINGS.PASSWORD, {allowEdit: true, size: "full"});
        })

    },
    updatePage: function(user, args){
        this.buildPage(user, args)
    },
};

export {settings}