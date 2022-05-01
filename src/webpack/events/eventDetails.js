import "./eventDetails.scss";

var lidlRTO = window.lidlRTO;

import {Snackbar} from "../helpers/snackbar";
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

import * as FilePond from "filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginGetFile from "filepond-plugin-get-file";

import {MDCList} from "@material/list";
import {MDCRipple} from "@material/ripple";
import {MDCMenu} from "@material/menu";

let eventDetails = {
    title: "eventDetails",
    init: function (args) {
        let self = this;
        $(document).ready(function () {
            //debug line, remove before flight
            console.log("loading js module: " + self.title);

            var lidlRTO = window.lidlRTO;
            var user;
            var profile = new window.profile.Profile(window.userId);

            // create new observer
            var ob1 = new lidlObserver(function(u){
                user = u;
            });
            window.snackbar = new Snackbar();

            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            profile.getUserAndSubscribe(ob1)
                .then(function(user){
                    notifyPage({user:user})
                })
                .catch(function(reason){
                    console.error("Failed to retrieve user data:" + reason)
                });

            var currentExploredEvent;
            var eventProfile = new EventRequest(window.exploreEventId, {
                populateParticipants: true,
            });

            // create new observer
            var ob2 = new lidlObserver(function(event){
                currentExploredEvent = event;
            });

            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            eventProfile.getEventAndSubscribe(ob2)
                .then(function(event){
                    notifyPage({event: event})
                })
                .catch(function(reason){
                    console.error("Failed to retrieve event data:" + reason)
                });

            let pageData = {};
            function notifyPage(obj) {
                Object.assign(pageData, obj);
                if(pageData.user && pageData.event) {
                    if (args.edit) {
                        buildPageEdit(pageData.user, pageData.event, args)
                    }
                    else buildPageView(pageData.user, pageData.event, args)
                }
            }

            function buildPageView(user, event, args) {
                let page = new EventPage();

                // window.DockerElement = new docker.Docker(window.dockerArgs); //done in init
                window.DockerElement.addDockerSubPage("event", event, {}, undefined, {currentEvent: {edit: args.allowEdit}});

                const list = new MDCList(document.querySelector('.mdc-list'));
                const listItemRipples = list.listElements.map((listItemEl) => new MDCRipple(listItemEl));

                $(".download-button").on("click", function(e){
                    e.preventDefault();
                });

                $(list.listElements).on("click", function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    let url  = $(this).find(".download-button").first().attr('href');
                    window.open(url, '_self');
                })

                let callback = {
                    onConfirm: function(editableTextField){
                        let delta = editableTextField.getQuill().getContents();
                        eventActions.saveDelta(event.id, delta, {
                            onSuccess: function(result){
                                editableTextField = editableTextField.reset(editableTextFieldContainer, result.description.longDesc.delta, result.description.longDesc.html, callback, {readOnly: true})
                            }
                        })
                    }
                };
                let editableTextFieldContainer = document.getElementById("eventDescribtionEditor");
                let editableTextField = new common.EditableTextField(editableTextFieldContainer, event.description.longDesc.delta, event.description.longDesc.html, callback, {readOnly: true});

                let cb = {
                    onConfirm: function(editableInputField){
                        let delta = editableInputField.getQuill().getContents();
                        let key = "title.delta";
                        eventActions.updateKey(event.id, key, delta, {
                            onSuccess: function(result){
                                editableInputField = editableInputField.reset(titleInputContainer, result.title.delta, result.title.html, "text", cb, {readOnly: true})
                            }
                        })
                    }
                };
                let titleInputContainer = document.getElementById("eventtitle-input");
                let editableInputField = new common.EditableInputField(titleInputContainer, event.title.delta, event.title.html, "text", cb, {readOnly: true});

                //get event type
                switch(event.type.raw){
                    case "eventTraining":
                        buildTrainingPage();
                        break;
                    case "eventSeminar":
                        buildSeminarPage();
                        break;
                    case "eventSan":
                        buildSanPage();
                        break;
                    case undefined:
                    default:
                }


                var ddMenu = common.DropdownMenu(".dropdown-menu", "click", ".dropdown-btn");

                var sidebar = new Sidebar('wrapper', "test");
                sidebar.addPlugin(eventPlugin);
                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                sidebar.addContent("eventParticipants", {
                    event: event,
                    user: user,
                    isParticipant: userIsParticipant,
                    callback: {
                        onConfirm: function(){
                            eventActions.addParticipant(event.id, user.id)
                        },
                        onDelete: function(){
                            eventActions.removeParticipant(event.id, user.id)
                        }
                    },
                });
                if(phone.matches || tablet.matches) {
                    sidebar.hide();
                }
                else {
                    sidebar.show();
                }

                function buildTrainingPage(){
                    page.addComponent(window.eventPage.componentTypes.DESCRIPTION);
                    page.addComponent(window.eventPage.componentTypes.DATE);
                    page.addComponent(window.eventPage.componentTypes.LOCATION);
                }

                function buildSeminarPage(){

                }

                function buildSanPage(){

                }

            }

            function buildPageEdit(user, event, args) {

                // window.DockerElement = new docker.Docker(window.dockerArgs);
                let eventDockerPageId = window.DockerElement.addDockerSubPage("eventEdit", event, {}, undefined, {currentEvent: {edit: args.allowEdit}});

                var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

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

                const list = new MDCList(document.querySelector('.mdc-list'));
                const listItemRipples = list.listElements.map((listItemEl) => new MDCRipple(listItemEl));
                // const dropdownOptions = list.listElements.forEach(listItemEl => new MDCMenu($(listItemEl).find('.mdc-menu')));
                list.listElements.forEach(function(listItemEl){
                    var it = $(listItemEl).parent(".mdc-list-item-wrapper").find('.mdc-menu');
                    var menu;
                    $(it).each(function(index){
                        menu = new MDCMenu(this);
                        menu.open = false;
                        listItemEl.menu = menu;
                        $(listItemEl).click(function(e){
                            this.menu.open = true;
                        })
                        $(menu.items).closest(".menu-entry-delete").on("click", function(e) {

                            let uniqueId = this.dataset.id;
                            eventActions.deleteFileFromStorage(event.id, uniqueId, {
                                onSuccess: function(){
                                    $(listItemEl).parent(".mdc-list-item-wrapper").next(".mdc-list-divider").remove();
                                    listItemEl.remove();
                                },
                            })
                        });
                        $(menu.items).closest(".menu-entry-download").on("click", function(e) {
                            let url  = $(this).find(".download-button").first().attr('href');
                            window.open(url, '_self');
                        });

                    })

                });

                let callback = {
                    onConfirm: function(editableTextField){
                        let delta = editableTextField.getQuill().getText();
                        let key = "description.longDesc.value";
                        eventActions.updateKey(event.id, key, delta, {})
                        delta = editableTextField.getQuill().getContents();
                        eventActions.saveDelta(event.id, delta, {
                            onSuccess: function(result){
                                editableTextField = editableTextField.reset(editableTextFieldContainer, result.description.longDesc.delta, result.description.longDesc.html, callback, {})
                            }
                        })
                    }
                };
                let editableTextFieldContainer = document.getElementById("eventDescriptionEditor");
                let editableTextField = new common.EditableTextField(editableTextFieldContainer, event.description.longDesc.delta, event.description.longDesc.html, callback, {});


                let cb = {
                    onConfirm: function(editableInputField){
                        let delta = editableInputField.getQuill().getText();
                        let key = "title.value";
                        eventActions.updateKey(event.id, key, delta, {})
                        delta = editableInputField.getQuill().getContents();
                        key = "title.delta";
                        eventActions.updateKey(event.id, key, delta, {
                            onSuccess: function(result){
                                editableInputField = editableInputField.reset(titleInputContainer, result.title.delta, result.title.html, "text", cb, {})
                                //update docker nav
                                eventProfile.refreshEvent()
                                    .then(function(ev){
                                        event = ev;
                                        window.DockerElement.subpageHandler.update(eventDockerPageId, "event", event)
                                    })
                                    .catch(function(err){
                                        throw new Error(err)
                                    });
                            }
                        })
                    }
                };
                let titleInputContainer = document.getElementById("eventtitle-input");
                let editableInputField = new common.EditableInputField(titleInputContainer, event.title.delta, event.title.html, "text", cb, {limit: 40});

                let sidebar = new Sidebar('wrapper', "test");
                sidebar.addPlugin(eventPlugin);

                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                sidebar.addContent("eventParticipants", {
                    event: event,
                    user: user,
                    isParticipant: userIsParticipant,
                    callback: {
                        onConfirm: function(){
                            eventActions.addParticipant(event.id, user.id)
                        },
                        onDelete: function(){
                            eventActions.removeParticipant(event.id, user.id)
                        }
                    },
                });
                if(phone.matches || tablet.matches) {
                    sidebar.hide();
                }
                else {
                    sidebar.show();
                }

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

                //initialize filepond
                FilePond.setOptions(
                    {
                        server: {
                            url: '/api/v1/eventmod/' + event.id + "/uploadFile",
                            load: '/load/',
                            restore: '/load/',
                            remove: (source, load, error) => {
                                console.error("REMOVE")
                            }

                        },
                    });
                FilePond.registerPlugin(FilePondPluginImagePreview, FilePondPluginGetFile);

                const inputElement = document.querySelector('#materialUploadElement');
                const pond = FilePond.create( inputElement , {
                    allowMultiple: true,
                    files: [],
                    credits: false,
                    imagePreviewMaxHeight: 100,
                });
            }
        })
    }
};

export {eventDetails}