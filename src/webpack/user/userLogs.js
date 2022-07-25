import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {UserProfile} from "../userprofile/userprofile";
import {userActions} from "../actions/userActions";
import {ScrollableList} from "../scrollableList/scrollableList"

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

$(document).ready (function () {
    var lidlRTO = window.lidlRTO;
    var common = window.common;
    var actions = window.actions;

    var currentExploredUser;
    var profile = new UserProfile(window.exploreUserId);
    var sidebar = new Sidebar('wrapper', "test");
    sidebar.addPlugin(userPlugin);

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
        window.DockerElement.addDockerSubPage("userEdit", user, {}, undefined, {currentUser: {edit: window.allowedit}});
        currentExploredUser = user;
        var userid = window.exploreUserId;

        var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

        //get Logs for user
        actions.getLogs(user.id, "ALL", {
            onSuccess: function(result){
                let container = document.getElementById('loglist-container');
                let args = {
                    height: "full",
                    sorting: {
                        property: "timestamp",
                        direction: -1,
                    }
                }
                let callback = {
                    listItem: {
                        onClick: function(e){
                            let self = e.currentTarget;
                            e.preventDefault();
                            //get full log from results
                            let logObj = result.find(function(el){
                                return el.id === self.dataset.logid;
                            })
                            sidebar.addContent("logDetails", {
                                log: logObj
                            });
                            sidebar.show();
                        }
                    }
                }
                let scrollableList = new ScrollableList(container, "log", result, args, callback)
                // displayLogList(result);
            }
        })
    }
});