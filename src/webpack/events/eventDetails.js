import "./eventDetails.scss";

var lidlRTO = window.lidlRTO;

import {UserProfile} from "../userprofile/userprofile";

import Snackbar from "../helpers/snackbar";
import {DropdownMenu} from "../helpers/dropdownMenu";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";

import Sidebar from "../sidebar/Sidebar";
import {eventPlugin} from "../sidebar/plugins/plugin-event";

import eventActions from "../actions/eventActions";

import {EventRequest} from "./eventRequest";
import {EventPage} from "./eventPage";

import {phone, tablet} from "../helpers/variables";
import EditableInputField from "../helpers/EditableInputField";
import PageModule from "../utils/PageModule";
import aclActions from "../actions/aclActions";

export default new PageModule ({
    title: "events.details",
    pageData: {},
    init: async function (args) {
        var currentUserProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);

        // create new observer
        var ob1 = new lidlObserver((u) => {
            this.pageData.user = u;
        });
        window.snackbar = new Snackbar();

        // get user data from user service
        //subscribe as observer to get notification if user changes on server
        const user = await currentUserProfile.getUserAndSubscribe(ob1)

        let eventProfile = new EventRequest(window.exploreEventId, {
            populateParticipants: true,
        });

        // create new observer
        let ob2 = new lidlObserver((event)=> {
            this.pageData.event = event;
        });

        // get user data from user service
        //subscribe as observer to get notification if user changes on server
        let event = await eventProfile.getEventAndSubscribe(ob2);
        this.pageData.eventProfile = eventProfile;


        const data = {
            event: event,
            user: user,
        };

        args.edit = window.allowedit;

        return {args, data}

    },
    // buildPage: function(user, event, args){
    buildPage: async function({args={}, data={}}={}) {
        const user = data.user;
        const event = data.event;
        let self = this;
        self.eventProfile = this.pageData.eventProfile;

        var lidlRTO = window.lidlRTO;
        var sidebar = new Sidebar('wrapper');
        sidebar.addPlugin(eventPlugin);

        let pageContainer = document.getElementById("eventPage-component-container");
        var eventPage = new EventPage({
            container: pageContainer,
            sidebar: sidebar,
            data: {user: user, event: event},
            args: {},
        });
        window.eventPage = eventPage;

        buildPageCommon(user, event, args);
        if (args.edit) {
            buildPageEdit(user, event, args)
        }
        else buildPageView(user, event, args)

        function buildPageCommon(user, event, args) {
            // window.DockerElement = new docker.Docker(window.dockerArgs); //done in init
            self.pageData.eventSubpageId = window.DockerElement.addDockerSubPage("event", event, {}, undefined, {currentEvent: {edit: args.allowEdit}});
        }

        function buildPageView(user, event, args) {

            let titleInputContainer = document.getElementById("eventtitle-input");
            let editableInputField = new EditableInputField(titleInputContainer, event.title.delta, "text", {}, {readOnly: true});

            switch(event.type.index){
                case 1:
                    buildTrainingPage();
                    break;
                case 2:
                    buildSeminarPage();
                    break;
                case 3:
                    buildSanPage();
                    break;
                case undefined:
                default:
            }

            if(phone.matches || tablet.matches) {
                sidebar.hide();
            }
            else {
                sidebar.show();
            }

            function buildTrainingPage(){
                eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: false, size: "full"});
                eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: false, size: "half"});
                eventPage.addComponent(EventPage.componentTypes.FILES, {allowEdit: false, size: "half"});

                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                sidebar.addContent("eventParticipants", {
                    event: event,
                    user: user,
                    isParticipant: userIsParticipant,
                    callback: {
                        onConfirm: function(){
                            eventActions.addParticipant(event.id, user.id, function(event) {
                                self.eventProfile.refreshEvent()
                                    .then(event => {
                                        userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                                        sidebar.update({event: event, isParticipant: userIsParticipant})
                                    })
                                    .catch(err => {
                                    })
                            })
                        },
                        onDelete: function(){
                            eventActions.removeParticipant(event.id, user.id, function(){
                                self.eventProfile.refreshEvent()
                                    .then(event => {
                                        userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                                        sidebar.update({event: event, isParticipant: userIsParticipant})
                                    })
                                    .catch(err => {
                                    })
                            })
                        }
                    },
                });

            }

            function buildSeminarPage(){
                eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: false, size: "full"});
                eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: false, size: "half"});
                eventPage.addComponent(EventPage.componentTypes.FILES, {allowEdit: false, size: "half"});

                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                sidebar.addContent("eventPostings", {
                    event: event,
                    user: user,
                    isParticipant: userIsParticipant,
                    callback: {

                    },
                });

            }

            function buildSanPage(){
                eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: false, size: "full"});
                eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: false, size: "half"});
                eventPage.addComponent(EventPage.componentTypes.FILES, {allowEdit: false, size: "half"});

                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                sidebar.addContent("eventPostings", {
                    event: event,
                    user: user,
                    isParticipant: userIsParticipant,
                    callback: {

                    },
                });
            }

        }

        function buildPageEdit(user, event, args) {
            const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

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

            let cb = {
                onConfirm: function(editableInputField){
                    let data = {
                        delta: editableInputField.getQuill().getContents(),
                        value: editableInputField.getQuill().getText(),
                    }
                    eventActions.saveTitle(event.id, data, {
                        onSuccess: function(result){
                            editableInputField = editableInputField.reset(titleInputContainer, result.title.delta, "text", cb, {})
                            //update docker nav
                            self.eventProfile.refreshEvent()
                                .then(function(ev){
                                    event = ev;
                                    window.DockerElement.subpageHandler.update(self.pageData.eventSubpageId, "event", event)
                                })
                                .catch(function(err){
                                    throw new Error(err)
                                });
                        }
                    })
                }
            };
            let titleInputContainer = document.getElementById("eventtitle-input");
            let editableInputField = new EditableInputField(titleInputContainer, event.title.delta, "text", cb, {limit: 40});

            let eventDate = function(component){
                $("#eventDateEditor").on("click", function(){
                    sidebar.addContent("editEventDate", {
                        event: event,
                        callback: {
                            onConfirm: function(eventid, data){
                                eventActions.updateDate(event.id, {date: data.date, startTime: data.startTime, endTime: data.endTime }, {
                                    onSuccess: function(){
                                        window.location.reload();
                                    },
                                    onError: function(error) {
                                        sidebar.addErrorMessage("Failed to save entry to database: " + error.msg, null, true, false)
                                    }
                                });
                            },
                        },
                    });
                    sidebar.show();
                })
            }

            let eventLocation = function(component) {
                $("#eventLocationEditor").on("click", function(){
                    sidebar.addContent("editEventLocation", {
                        event: event,
                        callback: {
                            onConfirm: function(eventid, data){
                                eventActions.updateKey(event.id, "location", {value: data.location}, {
                                    onSuccess: function(){
                                        window.location.reload();
                                    },
                                    onError: function(error) {
                                        sidebar.addErrorMessage("Failed to save entry to database: " + error.msg, null, true, false)
                                    }
                                });
                            },
                        },
                    });
                    sidebar.show();
                })
            }

            //get event type
            switch(event.type.index){
                case 1:
                    buildTrainingPage();
                    break;
                case 2:
                    buildSeminarPage();
                    break;
                case 3:
                    buildSanPage();
                    break;
                case undefined:
                default:
            }

            if(phone.matches || tablet.matches) {
                sidebar.hide();
            }
            else {
                sidebar.show();
            }

            function buildTrainingPage(){
                eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: true, size: "full"});
                eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: true, size: "half", handlers: [eventDate, eventLocation]});
                eventPage.addComponent(EventPage.componentTypes.FILES, {allowEdit: true, size: "half"});

                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                sidebar.addContent("eventParticipants", {
                    event: event,
                    user: user,
                    isParticipant: userIsParticipant,
                    callback: {
                        onConfirm: function(){
                            eventActions.addParticipant(event.id, user.id, function(event) {
                                self.eventProfile.refreshEvent()
                                    .then(event => {
                                        userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                                        sidebar.update({event: event, isParticipant: userIsParticipant})
                                    })
                                    .catch(err => {
                                    })
                            })
                        },
                        onDelete: function(){
                            eventActions.removeParticipant(event.id, user.id, function(){
                                self.eventProfile.refreshEvent()
                                    .then(event => {
                                        userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                                        sidebar.update({event: event, isParticipant: userIsParticipant})
                                    })
                                    .catch(err => {
                                    })
                            })
                        }
                    },
                });
            }

            function buildSeminarPage(){
                eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: true, size: "full"});
                eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: true, size: "half", handlers: [eventDate, eventLocation]});
                eventPage.addComponent(EventPage.componentTypes.FILES, {allowEdit: true, size: "half"});

                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                sidebar.addContent("eventPostings", {
                    event: event,
                    user: user,
                    isParticipant: userIsParticipant,
                    callback: {},
                });
            }

            function buildSanPage(){
                eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: true, size: "full"});
                eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: true, size: "half", handlers: [eventDate, eventLocation]});
                eventPage.addComponent(EventPage.componentTypes.FILES, {allowEdit: true, size: "half"});

                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = self.eventProfile.checkIfUserIsRegistered(user);
                sidebar.addContent("eventPostings", {
                    event: event,
                    user: user,
                    isParticipant: userIsParticipant,
                    callback: {
                    },
                });
            }
        }
    },
    updatePage: function(user, event, args){
        this.buildPage(user, event, args)
    }
});