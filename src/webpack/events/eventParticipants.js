import "./eventParticipants.scss";


var lidlRTO = window.lidlRTO;

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";
import {DropdownMenu, Corner} from "../helpers/dropdownMenu";

import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {eventPlugin} from "../sidebar/plugins/plugin-event";

import {actions, eventActions} from "../actions/actions";

import {EventRequest} from "./eventRequest";
import {EventPage} from "./eventPage";

import {phone, tablet} from "../helpers/variables";


let eventParticipants = {
    title: "eventParticipants",
    init: function (args) {
        let self = this;
        $(document).ready(function () {
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
                window.DockerElement.addDockerSubPage("event", event, {}, undefined, {currentEvent: {edit: args.allowEdit}});

                var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

                var sidebar = new Sidebar('wrapper', {title: "Test"});
                sidebar.addPlugin(eventPlugin);
                // init event sidebar
                //find if current user is already registered
                let userIsParticipant = eventProfile.checkIfUserIsRegistered(window.user);
                sidebar.addContent("eventParticipants", {
                    event: event,
                    user: window.user,
                    isParticipant: userIsParticipant,
                    callback: {
                        onConfirm: function(){
                            eventActions.addParticipant(event.id, window.user.id, function(){
                                eventProfile.refreshEvent()
                                    .then(event => {
                                        userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                        sidebar.update({event: event, isParticipant: userIsParticipant});
                                        self.userlist = event.participants;
                                        displayParticipantsList(self.userlist);
                                        self.searchbar.hide();
                                    })
                                    .catch(err => {
                                    })
                            })
                        },
                        onDelete: function(){
                            eventActions.removeParticipant(event.id, window.user.id, function(){
                                eventProfile.refreshEvent()
                                    .then(event => {
                                        userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                        sidebar.update({event: event, isParticipant: userIsParticipant});
                                        self.userlist = event.participants;
                                        displayParticipantsList(self.userlist);
                                        self.searchbar.hide();
                                    })
                                    .catch(err => {
                                    })
                            })
                        }
                    },
                });
                sidebar.show();
                let rolesMap = {
                    "participant": 0,
                    "lecturer": 1,
                    "admin": 2,
                }
                //display all users initially
                self.userlist = event.participants;
                self.scrollableList = displayParticipantsList(self.userlist);

                let titleInputContainer = document.getElementById("eventtitle-input");
                let editableInputField = new common.EditableInputField(titleInputContainer, event.title.delta, event.title.html, "text", {}, {readOnly: true});

                //setup searchbar
                let searchbar = document.getElementById("usersearch-participants");
                self.searchbar = new Searchbar(searchbar, {
                    onInput: {
                        enabled: true,
                        callback: function(inputValue){
                            let filteredList = self.userlist.filter(function(participant){
                                return participant.user.username.includes(inputValue) || participant.user.generalData.firstName.value.includes(inputValue) || participant.user.generalData.lastName.value.includes(inputValue);
                            })
                            displayParticipantsList(filteredList);

                        },
                    },
                });
                $('.add-participant-button').each(function(){
                    $(this).on("click", function(e){
                        e.preventDefault();
                        sidebar.addContent("addEventParticipant", {
                            event: event,
                            user: window.user,
                            isParticipant: userIsParticipant,
                            callback: {
                                onConfirm: function(data){
                                    eventActions.addParticipant(event.id, data.userid, function(event){
                                        eventProfile.refreshEvent()
                                            .then(event => {
                                                userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                                sidebar.update({event: event, isParticipant: userIsParticipant});
                                                self.userlist = event.participants;
                                                displayParticipantsList(self.userlist);
                                                self.searchbar.hide();
                                            })
                                            .catch(err => {
                                            })
                                    })
                                },
                            },
                        });
                        sidebar.show();
                    })
                });


                function displayParticipantsList(userlist) {

                    let sortedList = userlist.sort(function(a,b){
                        return (rolesMap[b.role] - rolesMap[a.role]);
                    })

                    let roleSelect = function(){
                        $('.participant-role-select').each(function(){
                            //display current role

                            $(this).on("change", function(e){
                                //push changes to server
                                let userId = e.target.dataset.userid;
                                let role = e.target.value;
                                console.log("changed role for uid: " + userId + " to " + role);
                                eventActions.changeParticipant(event.id, userId, role);
                            })

                        });
                    }

                    let dropdownMenus = function(){
                        $('.participant-menu-container').each(function(){
                            let trigger = $(this).find(".participant-menu-button").first();
                            let m = new DropdownMenu(this, "click", trigger, {anchorCorner: Corner.BOTTOM_LEFT, fixed: true})
                        });
                    }
                    let deleteParticipant = function(){
                        $('.participant-delete').each(function(){
                            $(this).on("click", function(e){
                                //push changes to server
                                e.preventDefault();
                                let userId = e.target.dataset.userid;
                                eventActions.removeParticipant(event.id, userId, function(){
                                    eventProfile.refreshEvent()
                                        .then(event => {
                                            userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                            sidebar.update({event: event, isParticipant: userIsParticipant});
                                            self.userlist = event.participants;
                                            displayParticipantsList(self.userlist);
                                            self.searchbar.hide();
                                        })
                                        .catch(err => {
                                        })
                                });
                            })
                        });
                    }
                    let scrollArgs = {
                        height: "fixed",
                        fixedHeight: "500px",
                        sorting: {
                            property: "role",
                            direction: 1,
                        },
                        allowEdit: args.allowEdit,
                    }
                    let callback = {
                        customHandlers: [deleteParticipant, roleSelect, dropdownMenus]
                    }

                    let listContainer = document.getElementById("userlist-container--participants")
                    let scrollableList = new ScrollableList(listContainer, "participants", sortedList, scrollArgs, callback)

                    return scrollableList;
                }
            }


        })
    }
};

export {eventParticipants}