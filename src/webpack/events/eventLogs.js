import "./eventLogs.scss";


var lidlRTO = window.lidlRTO;

import {lidl} from "/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";

import {Preloader} from "../helpers/preloader";
import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {eventPlugin} from "../sidebar/plugins/plugin-event";
import {logPlugin} from "../sidebar/plugins/plugin-logs";

import {actions, eventActions} from "../actions/actions";

import {EventRequest} from "./eventRequest";
import {EventPage} from "./eventPage";
import {phone, tablet} from "../helpers/variables";
import {DropdownMenu} from "../helpers/dropdownMenu";

let eventLogs = {
    title: "eventLogs",
    init: function (args) {
        let self = this;
        $(document).ready(function () {
            let plr = new Preloader();
            plr.show();
            //debug line, remove before flight
            console.log("loading js module: " + self.title);


            var currentExploredEvent;
            var eventProfile = new EventRequest(window.exploreEventId, {
                populateParticipants: true,
            });

            // create new observer
            var observer = new lidlObserver(function(event){
                currentExploredEvent = event;
            });

            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            eventProfile.getEventAndSubscribe(observer)
                .then(function(event){
                    buildPage(event, args)
                })
                .catch(function(reason){
                    console.error("Failed to retrieve event data:" + reason)
                });

            function buildPage(event, args) {

                // window.DockerElement = new docker.Docker(window.dockerArgs);
                window.DockerElement.addDockerSubPage("event", event, {}, undefined, {currentEvent: {edit: window.allowedit}});

                // const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

                var sidebar = new Sidebar('wrapper', {title: "Test"});
                sidebar.addPlugin(eventPlugin);
                sidebar.addPlugin(logPlugin);
                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = eventProfile.checkIfUserIsRegistered(window.user);
                //get Logs for user
                actions.getLogs(event.id, "ALL", {
                    onSuccess: function(result){
                        displayLogList(result);
                    }
                })
                function displayLogList(result) {
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
                    let scrollableList = new ScrollableList(container, "log", result, args, callback);
                    plr.hide();
                }
            }
        })
    }
};

export {eventLogs}