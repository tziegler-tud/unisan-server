import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {userActions} from "../actions/userActions";

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

$(document).ready (function () {

    var lidlRTO = window.lidlRTO;
    var common = window.common;
    var actions = window.actions;

    var currentExploredUser;
    var profile = new window.profile.Profile(window.exploreUserId);

    // create new observer
    var observer = new lidlObserver(function(user){
        currentExploredUser = user;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    profile.getUserAndSubscribe(observer)
        .then(function(user){
            buildPage(user)
        })
        .catch(function(reason){
            console.error("Failed to retrieve user data:" + reason)
        });

    function buildPage(user) {

        // window.DockerElement = new docker.Docker(window.dockerArgs);
        if (window.allowedit) {
            window.DockerElement.addDockerSubPage("userEdit", user, {}, undefined, {currentUser: {edit: window.allowedit}});
        }
        else {
            window.DockerElement.addDockerSubPage("user", user, {}, undefined, {currentUser: {edit: window.allowedit}});
        }

        var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

        var addDBKey_sidebar = new Sidebar('wrapper', "test");
        addDBKey_sidebar.addPlugin(userPlugin);

    }
});