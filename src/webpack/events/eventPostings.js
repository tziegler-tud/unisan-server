import "./eventPostings.scss";


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


let eventPostings = {
    title: "eventPostings",
    init: function (args) {
        let self = this;
        $(document).ready(function () {
            //debug line, remove before flight
            console.log("loading js module: " + self.title);


            var currentExploredEvent;
            var eventProfile = new EventRequest(window.exploreEventId, {
                populateParticipants: true,
                populatePostings: true,

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
                sidebar.addContent("eventPostings", {
                    event: event,
                    user: window.user,
                    isParticipant: userIsParticipant,
                    callback: {
                        onConfirm: function(){

                        },
                        onDelete: function(){

                        }
                    },
                });
                sidebar.show();
                //display all users initially
                self.userlist = event.postings;
                self.scrollableList = displayPostingsList(self.userlist);

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
                            displayPostingsList(filteredList);

                        },
                    },
                });

                $('.add-participant-button').each(function(){
                    $(this).on("click", function(e){
                        e.preventDefault();
                        sidebar.addContent("addEventPosting", {
                            event: event,
                            user: window.user,
                            isParticipant: userIsParticipant,
                            qualTypes: qualTypes,
                            callback: {
                                onConfirm: function(data){
                                    eventActions.addPosting(event.id, data.posting, function(event){
                                        eventProfile.refreshEvent()
                                            .then(event => {
                                                userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                                sidebar.update({event: event, isParticipant: userIsParticipant});
                                                self.userlist = event.participants;
                                                displayPostingsList(self.userlist);
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


                function displayPostingsList(userlist) {

                    let sortedList = userlist.sort(function(a,b){
                        return (a-b);
                    })

                    let dropdownMenus = function(){
                        $('.participant-menu-container').each(function(){
                            let trigger = $(this).find(".participant-menu-button").first();
                            let m = new DropdownMenu(this, "click", trigger, {anchorCorner: Corner.BOTTOM_LEFT, fixed: true})
                        });
                    }
                    let deletePosting = function(){
                        $('.posting-delete').each(function(){
                            $(this).on("click", function(e){
                                //push changes to server
                                e.preventDefault();
                                let postingId = e.target.dataset.postingid;
                                eventActions.removePosting(event.id, postingId, function(){
                                    eventProfile.refreshEvent()
                                        .then(event => {
                                            self.userlist = event.postings;
                                            displayPostingsList(self.userlist);
                                            self.searchbar.hide();
                                        })
                                        .catch(err => {
                                        })
                                });
                            })
                        });
                    }
                    let showParticipant = function(){
                        $('.participant-details').each(function(){
                            $(this).on("click", function(e){
                                //push changes to server
                                e.preventDefault();
                                let userId = e.target.dataset.userid;
                                window.location.href= "/unisams/user/"+userId;
                            })
                        });
                    }

                    let postDetails = function(){
                        $('.posting-details').each(function(){
                            $(this).on("click", function(e){
                                //push changes to server
                                e.preventDefault();
                                sidebar.addContent("showPostingDetails", {
                                    event: event,
                                    posting: e.target.dataset.postingid,
                                })
                            })
                        });
                    }

                    let unassignPost = function(){
                        $('.posting-unassign').each(function(){
                            $(this).on("click", function(e){
                                //push changes to server
                                e.preventDefault();
                                eventActions.unassignPost(event.id, e.target.dataset.postingid, e.target.dataset.userid, function(){
                                })
                            })
                        });
                    }

                    let scrollArgs = {
                        height: "full",
                        // fixedHeight: "500px",
                        sorting: {
                            property: "role",
                            direction: 1,
                        },
                        allowEdit: args.allowEdit,
                    }
                    let callback = {
                        customHandlers: [deletePosting, dropdownMenus, showParticipant, postDetails, unassignPost]
                    }

                    let listContainer = document.getElementById("userlist-container--participants")
                    let scrollableList = new ScrollableList(listContainer, "postings", sortedList, scrollArgs, callback)

                    return scrollableList;
                }
            }


        })
    }
};

export {eventPostings}