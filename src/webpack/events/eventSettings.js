import "./eventSettings.scss";

import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";

import EditableInputField from "../helpers/EditableInputField";

import Sidebar from "../sidebar/Sidebar";
import {eventPlugin} from "../sidebar/plugins/plugin-event";

import eventActions from "../actions/eventActions";

import {EventRequest} from "./eventRequest";
import PageModule from "../utils/PageModule";

export default new PageModule ({
    title: "events.settings",
    init: async function (args) {
        let self = this;
        //debug line, remove before flight
        console.log("loading js module: " + self.title);

        var lidlRTO = window.lidlRTO;

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
        window.DockerElement.addDockerSubPage("event", event, {}, undefined, {currentEvent: {edit: window.allowedit}});

        var sidebar = new Sidebar('wrapper', {title: "Test"});
        sidebar.addPlugin(eventPlugin);
        // init event sidebar
        //find if current user is already registered
        let userIsParticipant = eventProfile.checkIfUserIsRegistered(window.user);

        let titleInputContainer = document.getElementById("eventtitle-input");
        let editableInputField = new EditableInputField(titleInputContainer, event.title.delta, "text", {}, {readOnly: true});

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
    },
});