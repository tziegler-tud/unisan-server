import "./eventSettings.scss";


var lidlRTO = window.lidlRTO;

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";

import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {eventPlugin} from "../sidebar/plugins/plugin-event";

import {actions, eventActions} from "../actions/actions";

import {EventRequest} from "./eventRequest";
import {EventPage} from "./eventPage";
import {phone, tablet} from "../helpers/variables";

let eventSettings = {
    title: "eventSettings",
    init: function (args) {
        let self = this;
        $(document).ready(function () {
            //debug line, remove before flight
            console.log("loading js module: " + self.title);

            var lidlRTO = window.lidlRTO;

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

                var sidebar = new Sidebar('wrapper', {title: "Test"});
                sidebar.addPlugin(eventPlugin);
                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = eventProfile.checkIfUserIsRegistered(window.user);

                let titleInputContainer = document.getElementById("eventtitle-input");
                let editableInputField = new common.EditableInputField(titleInputContainer, event.title.delta, event.title.html, "text", {}, {readOnly: true});

                const deleteContent = {
                    title: "Event löschen",
                    message: "Dieser Vorgang kann nicht rückgängig gemacht werden. Fortfahren?",
                    titleArg: "",
                    messageArg: ""
                };

                var deleteArgs = {
                    eventid: event.id,
                    callback: {
                        onConfirm: function () {
                            eventActions.deleteEvent(event.id)
                        }
                    }
                };

                var token = lidlRTO.objectManager.createNewObjectToken();
                const dialogDeleteEvent = new lidlDialog(token, ".eventDelete", 'confirmDelete', deleteContent, deleteArgs);
                lidlRTO.objectManager.addObject(dialogDeleteEvent, token);
            }
        })
    }
};

export {eventSettings}