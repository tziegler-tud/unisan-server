import Sidebar from "../sidebar/Sidebar";
import {userPlugin} from "../sidebar/plugins/plugin-user";

import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {Snackbar} from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import ComponentPage from "../components/ComponentPage";
import {UserProfile} from "../userprofile/userprofile";

let addNews = {
    title: "addNews",
    pageData: {},
    init: function (args) {
        let self  = this;
        self.initPromise = new Promise(function(resolve, reject){
            $(document).ready(function () {

                //debug line, remove before flight
                console.log("loading js module: settings." + self.title);

                self.pageData = {};
                var lidlRTO = window.lidlRTO;

                window.snackbar = new Snackbar();

                var userProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);

                // create new observer
                var ob1 = new lidlObserver(function (u) {
                    self.pageData.user = u;
                    self.updatePage(self.pageData.user, args)
                });
                window.snackbar = new Snackbar();
                // get user data from user service
                //subscribe as observer to get notification if user changes on server
                let userPromise = userProfile.getUserAndSubscribe(ob1)
                window.userProfile = userProfile;

                userPromise.then(user => {
                    self.pageData.user = user;
                    self.buildPage(self.pageData.user, args)
                        .then(result => {
                            resolve();
                        })
                        .catch(err => {
                            reject(err)
                        })
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
            let pageContainer = document.getElementById("componentPage-component-container");
            var componentPage = new ComponentPage({
                container: pageContainer,
                sidebar: sidebar,
                data: {user: user},
                args: {},
            });
            window.componentPage = componentPage;
            componentPage.addComponent({componentType: ComponentPage.componentTypes.NEWS.ADD, componentArgs: {size: "full", order: 1}, data: {user: user}})
                .then()
                .catch()
        })
    },
    updatePage: function(user, args){
        return this.buildPage(user, args)
    },
};

export {addNews}