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
                let scrollableList = new common.ScrollableList(container, "log", result, args, callback)
                // displayLogList(result);
            }
        })
        // function displayLogList(result) {
        //
        //     var handleData = {logs: result};
        //
        //     // render participantslist template
        //     $.get('/static/unisams/js/userprofile/templates/loglist.hbs', function (data) {
        //         var template = Handlebars.compile(data);
        //         appendContent(template(handleData))
        //     });
        //
        //     function appendContent(html) {
        //         //append to subpage container #userlist-container
        //         let container = document.getElementById('loglist-container');
        //         container.innerHTML = html;
        //
        //         //delay adjustment until sidebar finished rendering
        //         setTimeout(function(){
        //          adjustList(container)
        //         }, 250);
        //         // hook log entries to sidebar.
        //         $('.log-entry').each(function () {
        //             $(this).on("click", function (e) {
        //                 let self = e.currentTarget;
        //                 e.preventDefault();
        //                 //get full log from results
        //                 let logObj = result.find(function(el){
        //                     return el.id === self.dataset.logid;
        //                 })
        //                 sidebar.addContent("logDetails", {
        //                     log: logObj
        //                 });
        //                 sidebar.show();
        //             })
        //         });
        //
        //
        //     }
        //     function adjustList(c) {
        //         let container = c === undefined ? document.getElementById('loglist-container') : c;
        //         // set width of first row
        //         let row = document.getElementById("loglist-top");
        //
        //         //get viewport height
        //         const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        //         //get height of top navigation and topbar element
        //         let navHeight = document.getElementById("nav-top").clientHeight +1;
        //         let topbarHeight = document.getElementById("content1-heading").clientHeight;
        //         //calc remaining height
        //         let h = vh - (navHeight + topbarHeight + row.clientHeight + 10);
        //         //set element height
        //         $(container).css({
        //             "height": h + "px",
        //             "overflow": "auto",
        //         });
        //
        //         //get scollbar width
        //         let scrollbarWidth = container.offsetWidth - container.clientWidth;
        //         $(row).css({
        //             "width": "auto",
        //             "padding-right": scrollbarWidth + "px",
        //         })
        //     }
        //
        //     $(window).on('resize',function(){
        //         adjustList();
        //     });
        // }
    }
});