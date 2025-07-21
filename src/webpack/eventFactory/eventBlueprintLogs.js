import "./eventLogs.scss";

var lidlRTO = window.lidlRTO;
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import ScrollableList from "../scrollableList/ScrollableList";

import {Preloader} from "../helpers/preloader";
import Sidebar from "../sidebar/Sidebar";
import {eventPlugin} from "../sidebar/plugins/plugin-event";
import {logPlugin} from "../sidebar/plugins/plugin-logs";

import { actions } from "../actions/actions";

import {EventRequest} from "./eventRequest";
import PageModule from "../utils/PageModule";

export default new PageModule ({
    title: "eventBlueprint.logs",
    init: async function (args) {
        let self = this;
        this.plr = new Preloader();
        this.plr.show();
        //debug line, remove before flight
        console.log("loading js module: " + self.title);


        var currentExploredEvent;
        var eventProfile = new EventRequest(window.exploreEventId, {
            populateParticipants: true,
        });

        // create new observer
        var observer = new lidlObserver(function (event) {
            currentExploredEvent = event;
        });

        // get user data from user service
        //subscribe as observer to get notification if user changes on server
        const event = await eventProfile.getEventAndSubscribe(observer)
        const data = {
            event: event
        }
        return {args, data}
    },

    buildPage: async function({args={}, data={}}={}) {
        const event = data.event;

        // window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("eventBlueprint", event, {}, undefined, {currentEvent: {edit: window.allowedit}});

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
            this.plr.hide();
        }
    }
})
