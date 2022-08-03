import "./eventParticipants.scss";


var lidlRTO = window.lidlRTO;

import {UserProfile} from "../userprofile/userprofile";
import {Preloader} from "../helpers/preloader";

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";
import {DropdownMenu, Corner} from "../helpers/dropdownMenu";
import {EditableInputField} from "../helpers/editableInputField";

import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {eventPlugin} from "../sidebar/plugins/plugin-event";

import {actions, eventActions, qualificationActions} from "../actions/actions";

import {EventRequest} from "./eventRequest";
import {EventPage} from "./eventPage";

import {phone, tablet} from "../helpers/variables";
import {Snackbar} from "../helpers/snackbar";
import {common, getMatchingQualifications, getDataFromServer} from "../helpers/helpers";



let eventParticipants = {
    title: "eventParticipants",
    pageData: {},
    pageArgs: {},
    init: function (args) {
        let self = this;
        $(document).ready(function () {
            let plr = new Preloader();
            plr.show();
            //debug line, remove before flight
            console.log("loading js module: " + self.title);

            self.pageArgs = args;

            self.pageData = {};
            var lidlRTO = window.lidlRTO;
            var user;
            var userProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);

            // create new observer
            var ob1 = new lidlObserver(function (u) {
                user = u;
                self.pageData.user = user;
                self.updatePage(self.pageData.user, self.pageData.event, args)
            });
            window.snackbar = new Snackbar();

            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            let userPromise = userProfile.getUserAndSubscribe(ob1)

            var currentExploredEvent;
            var eventProfile = new EventRequest(window.exploreEventId, {
                populateParticipants: true,
            });

            // create new observer
            var ob2 = new lidlObserver(function (event) {
                currentExploredEvent = event;
                self.pageData.event = event;
                self.updatePage(self.pageData.user, self.pageData.event, args)
            });

            window.eventProfile = eventProfile;
            window.userProfile = userProfile;

            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            let eventPromise = eventProfile.getEventAndSubscribe(ob2);

            let userPostings = getDataFromServer("/api/v1/eventmod/userPostings/");

            Promise.all([eventPromise, userPromise, userPostings])
                .then(results => {
                    let event = results[0];
                    let user = results[1];
                    let userPostings =results[2];
                    self.pageData = {
                        event: event,
                        user: user,
                        userPostings: userPostings,
                    };
                    self.buildPage(self.pageData.user, self.pageData.event, args)
                    plr.hide();
                })
                .catch(function (reason) {
                    console.error("Failed to retrieve data:" + reason)
                })
        })
    },
    buildPage: function(user, event, args){
        let self = this;
        self.view = "cards";
        self.scrollableList;
        $('.radio-item').checkboxradio({
            icon: false,
            classes: {
                "ui-checkboxradio-label": "toggleButton",
                "ui-checkboxradio-checked": "toggleButton-checked"
            }
        });
        let checked= $('input[name=eventlist-radio]:checked');
        let listRadio = $("#eventlist01");
        let cardsRadio = $("#eventlist02");
        listRadio.on("change", function(){
            if (self.view === "cards") {
                self.view = "list";
                self.scrollableList.setView("list")
            }
        });
        cardsRadio.on("change", function(){
            if (self.view === "list") {
                self.view = "cards";
                self.scrollableList.setView("cards")
            }
        })
        //try to recreate checked state across page reloads
        if (checked.val()){
            self.view = checked.val();
        }

        // window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("event", self.pageData.event, {}, undefined, {currentEvent: {edit: args.allowEdit, type: self.pageData.event.type.index}});

        var sidebar = new Sidebar('wrapper', {title: "Test"});
        sidebar.addPlugin(eventPlugin);

        let userIsParticipant = window.eventProfile.checkIfUserIsRegistered(user);
        // init event sidebar
        sidebar.addContent("eventDetails", {
            event: self.pageData.event,
            user: self.pageData.user,
            isParticipant: userIsParticipant,
            callback: {
            },
        });
        if(!(phone.matches || tablet.matches)) sidebar.show();
        sidebar.setCurrentDefault();

        let pageContainer = document.getElementById("eventPage-component-container");
        var eventPage = new EventPage({
            container: pageContainer,
            sidebar: sidebar,
            data: {user: user, event: event},
            args: {},
        });
        window.eventPage = eventPage;

        let titleInputContainer = document.getElementById("eventtitle-input");
        let editableInputField = new EditableInputField(titleInputContainer,self.pageData.event.title.delta,self.pageData.event.title.html, "text", {}, {readOnly: true});

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});
        const deleteContent = {
            title: "Event löschen",
            message: "Dieser Vorgang kann nicht rückgängig gemacht werden. Fortfahren?",
            titleArg: "",
            messageArg: ""
        };

        var deleteArgs = {
            eventid:self.pageData.event.id,
            callback: {
                onConfirm: function () {
                    eventActions.deleteEvent(event.id)
                }
            }
        };

        var token = window.lidlRTO.objectManager.createNewObjectToken();
        const dialogDeleteEvent = new lidlDialog(token, ".eventDelete", 'confirmDelete', deleteContent, deleteArgs);
        window.lidlRTO.objectManager.addObject(dialogDeleteEvent, token);

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

        function buildTrainingPage(){
            var rolesMap = {
                "participant": 0,
                "lecturer": 1,
                "admin": 2,
            }

            self.view = "list";
            listRadio.checkboxradio("disable");
            cardsRadio.checkboxradio("disable");
            //find if current user is already registered

            //display all users initially
            self.dataList = event.participants;
            self.scrollableList = displayParticipantsList(self.dataList);

            //setup searchbar
            let searchbar = document.getElementById("usersearch-participants");
            self.searchbar = new Searchbar(searchbar, {
                onInput: {
                    enabled: true,
                    callback: function(inputValue){
                        let filteredList = self.dataList.filter(function(participant){
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
                        event: self.pageData.event,
                        user: user,
                        isParticipant: userIsParticipant,
                        callback: {
                            onConfirm: function(data){
                                eventActions.addParticipant(event.id, data.userid, function(event){
                                    window.eventProfile.refreshEvent()
                                        .then(event => {
                                            self.pageData.event = event;
                                            userIsParticipant = window.eventProfile.checkIfUserIsRegistered(user);
                                            sidebar.update({event: event, isParticipant: userIsParticipant});
                                            self.dataList =self.pageData.event.participants;
                                            displayParticipantsList(self.dataList);
                                            self.searchbar.hide();
                                        })
                                        .catch(err => {
                                        })
                                }).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
                            },
                        },
                    })
                    sidebar.show();
                })
            });
        }

        function buildSeminarPage() {
            //qualTypes to be enabled for new postings: (empty array to include all)
            let qualTypes = [qualTypesMap.AUSBILDUNG, qualTypesMap.NACHWEIS];

            //display all users initially
            self.dataList =self.pageData.event.postings;
            self.scrollableList = displayPostingsList(self.dataList);

            //setup searchbar
            let searchbar = document.getElementById("usersearch-participants");
            self.searchbar = new Searchbar(searchbar, {
                onInput: {
                    enabled: true,
                    callback: function(inputValue){
                        let filteredList = self.dataList.filter(function(participant){
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
                        event: self.pageData.event,
                        user: window.user,
                        isParticipant: userIsParticipant,
                        qualTypes: qualTypes,
                        callback: {
                            onConfirm: function(data, args){
                                let posting = {
                                    requiredQualifications: data.qualifications,
                                    description: data.description,
                                    allowHigher: data.allowHigher,
                                    optional: data.optional,
                                    enabled: data.enabled,
                                    assigned: {
                                        isAssigned: false,
                                    }
                                }
                                eventActions.addPosting(event.id, posting, function(event){
                                    eventProfile.refreshEvent()
                                        .then(event => {
                                            self.pageData.event = event;
                                            userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                            sidebar.update({event: event, isParticipant: userIsParticipant});
                                            self.dataList =self.pageData.event.postings;
                                            displayPostingsList(self.dataList);
                                            self.searchbar.hide();
                                        })
                                        .catch(err => {
                                        })
                                }, args).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
                            },
                        },
                    });
                    sidebar.show();
                })
            });

        }

        function buildSanPage() {
            //qualTypes to be enabled for new postings: (empty array to include all)
            let qualTypes = [qualTypesMap.SAN, qualTypesMap.FUEHRUNG];

            //display all users initially
            self.dataList =self.pageData.event.postings;
            self.scrollableList = displayPostingsList(self.dataList);

            //setup searchbar
            let searchbar = document.getElementById("usersearch-participants");
            self.searchbar = new Searchbar(searchbar, {
                onInput: {
                    enabled: true,
                    callback: function(inputValue){
                        let filteredList = self.dataList.filter(function(participant){
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
                        event: self.pageData.event,
                        user: window.user,
                        isParticipant: userIsParticipant,
                        qualTypes: qualTypes,
                        callback: {
                            onConfirm: function(data, args){
                                let posting = {
                                    requiredQualifications: data.qualifications,
                                    description: data.description,
                                    allowHigher: data.allowHigher,
                                    optional: data.optional,
                                    enabled: data.enabled,
                                    assigned: {
                                        isAssigned: false,
                                    }
                                }
                                eventActions.addPosting(event.id, posting, function(event){
                                    eventProfile.refreshEvent()
                                        .then(event => {
                                            self.pageData.event = event;
                                            userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                            sidebar.update({event: event, isParticipant: userIsParticipant});
                                            self.dataList =self.pageData.event.postings;
                                            displayPostingsList(self.dataList);
                                            self.searchbar.hide();
                                        })
                                        .catch(err => {
                                        })
                                }, args).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
                            },
                        },
                    });
                    sidebar.show();
                })
            });
        }

        function displayParticipantsList(dataList) {
            let roleSelect = function(){
                $('.participant-role-select').each(function(){
                    //display current role

                    $(this).on("change", function(e){
                        //push changes to server
                        let userId = e.currentTarget.dataset.userid;
                        let role = e.currentTarget.value;
                        console.log("changed role for uid: " + userId + " to " + role);
                        eventActions.changeParticipant(event.id, userId, role, function(){
                            eventProfile.refreshEvent()
                                .then(event => {
                                    self.pageData.event = event;
                                    userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                    sidebar.update({event: event, isParticipant: userIsParticipant});
                                })
                                .catch(err => {
                                })
                        }).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
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
                        let userId = e.currentTarget.dataset.userid;
                        eventActions.removeParticipant(event.id, userId, function(){
                            window.eventProfile.refreshEvent()
                                .then(event => {
                                    self.pageData.event = event;
                                    userIsParticipant = window.eventProfile.checkIfUserIsRegistered(user);
                                    sidebar.update({event: event, isParticipant: userIsParticipant});
                                    self.dataList =self.pageData.event.participants;
                                    displayParticipantsList(self.dataList);
                                    self.searchbar.hide();
                                })
                                .catch(err => {
                                })
                        }).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
                    })
                });
            }

            let showParticipant = function(){
                $('.participant-details').each(function(){
                    $(this).on("click", function(e){
                        //push changes to server
                        e.preventDefault();
                        let userId = e.currentTarget.dataset.userid;
                        window.location.href= "/unisams/user/"+userId;
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
                customHandlers: [deleteParticipant, roleSelect, dropdownMenus, showParticipant]
            }

            let listContainer = document.getElementById("userlist-container--participants")
            let scrollableList = new ScrollableList(listContainer, "participants", dataList, scrollArgs, callback)

            return scrollableList;
        }

        function displayPostingsList(dataList) {

            //check if user is already registered
            let isRegistered = eventProfile.checkIfUserIsRegistered(user, {
                role: "assigned"
            })

            let localUserPostings = []
            if (isRegistered) {
                //find all postings for the current user
                localUserPostings = dataList.filter(posting => {
                    if (posting.assigned.isAssigned){
                        let postingUserId = (posting.assigned.user._id === undefined) ? posting.assigned.user : posting.assigned.user._id;
                        return (postingUserId.toString() === self.pageData.user._id);
                    }
                    else return false;
                })
            }

            //filter out postings concerning the current event
            let globalUserPostings = self.pageData.userPostings.filter(posting => {
                return (posting.event.id.toString() !== self.pageData.event.id.toString());
            })

            function augmentPostingsList(list, localUserPostings, globalUserPostings){
                let sortedList = list;
                sortedList.forEach(posting =>{
                    //check if current user is assigned to this post
                    posting.isAssignedToSelf = false;
                    if (posting.assigned.isAssigned) {
                        posting.isAssignedToSelf = (posting.assigned.user.id.toString() === self.pageData.user._id)
                    }
                    let matchingQualifications = getMatchingQualifications(self.pageData.user, posting);
                    //check if user has posting at the same time
                    let localOverlap = findOverlap(localUserPostings, posting)
                    if(localOverlap !== undefined) {
                        //overlap found
                        posting.userIsBlocked = true;
                    }
                    else posting.userIsBlocked = false;

                    let globalOverlap = findOverlap(globalUserPostings, posting)
                    if(globalOverlap !== undefined) {
                        //overlap found
                        posting.userIsBlockedGlobally = true;
                        posting.globalBlock = globalOverlap;
                    }
                    else posting.userIsBlockedGlobally = false;
                    posting.userIsAllowed = (matchingQualifications.length > 0);
                    posting.matchingQualifications = matchingQualifications;
                })
                return sortedList;

                function findOverlap(postingsList, posting){
                    return postingsList.find(userPosting => {
                        if (userPosting.date.startDate < posting.date.startDate) { // a starts before b
                                if(userPosting.date.endDate > posting.date.startDate) { //a ends after b starts.
                                    return true;
                                }
                        }
                        if (posting.date.startDate < userPosting.date.startDate) { // b starts before a
                            if(posting.date.endDate > userPosting.date.startDate) { //b ends after a starts.
                                return true;
                            }
                        }
                        if (posting.date.startDate === userPosting.date.startDate) { // b starts together with a
                            return true;
                        }


                        // //another post starts between this posts start and end.
                        // if (userPosting.date.startDate <= posting.date.endDate && userPosting.date.startDate >= posting.date.startDate) {
                        //     //found overlap
                        //     return true
                        // }
                        // //another post ends between this posts start and end. Allow if it ends exactly when post starts, s.t. user can sign up for double shifts
                        // if (userPosting.date.endDate <= posting.date.endDate && userPosting.date.endDate > posting.date.startDate) {
                        //     //found overlap
                        //     return true
                        // }
                        // //another post start before the current ends, and
                        // if (userPosting.date.startDate <= posting.date.endDate && userPosting.date.endDate >= posting.date.endDate) {
                        //     //found overlap
                        //     return true
                        // }
                        // if (userPosting.date.startDate <= posting.date.startDate && userPosting.date.endDate >= posting.date.startDate) {
                        //     //found overlap
                        //     return true
                        // }
                        else return false;
                    });
                }
            }

            let sortedList = augmentPostingsList(dataList, localUserPostings, globalUserPostings)
            self.dataList = sortedList;

            let dropdownMenus = function(){
                $('.participant-menu-container').each(function(){
                    let trigger = $(this).find(".participant-menu-button").first();
                    let m = new DropdownMenu(this, "click", trigger, {anchorCorner: Corner.BOTTOM_LEFT, fixed: true})
                });
            }
            let deletePost = function(){
                $('.posting-delete').each(function(){
                    $(this).on("click", function(e){
                        //push changes to server
                        e.preventDefault();
                        e.stopPropagation();
                        let postingId = e.currentTarget.dataset.postingid;
                        deletePosting(self.pageData.event, postingId);
                    })
                });
            }
            let showParticipant = function(){
                $('.participant-details').each(function(){
                    $(this).on("click", function(e){
                        //push changes to server
                        e.preventDefault();
                        e.stopPropagation();
                        let userId = e.currentTarget.dataset.userid;
                        window.location.href= "/unisams/user/"+userId;
                    })
                });
            }

            let postDetails = function(){
                $('.posting-details, .posting-edit').each(function(){
                    $(this).on("click", function(e){
                        e.preventDefault();
                        let element = e.currentTarget;
                        let postingId = element.dataset.postingid;
                        showDetailsSidebar(postingId, element);
                    })
                });
            }


            let assignCurrentUser = function(){
                $('.posting-assignCurrentUser').each(function(){
                    $(this).on("click", function(e){
                        //push changes to server
                        e.preventDefault();
                        e.stopPropagation();
                        let postingId = e.currentTarget.dataset.postingid;
                        let userId = self.pageData.user.id;
                        //find posting in local augmented list
                        assignUser(self.pageData.event, postingId, userId)
                    })
                });
            }

            let unassignPost = function(){
                $('.posting-unassign').each(function(){
                    $(this).on("click", function(e){
                        //push changes to server
                        e.preventDefault();
                        e.stopPropagation();
                        let event = self.pageData.event;
                        let postingId = e.currentTarget.dataset.postingid;
                        let userId = e.currentTarget.dataset.userid;
                        unassignUser(event, postingId, userId);
                    })
                });
            }

            let scrollArgs = {
                height: "full",
                enableMobile: true,
                view: self.view,
                // fixedHeight: "500px",
                sorting: {
                    property: "role",
                    direction: 1,
                },
                allowEdit: args.allowEdit,
                userIsRegistered: isRegistered,
            }
            let callback = {
                listItem: {
                    onClick: function (e) {
                        let element = e.currentTarget;
                        e.preventDefault();
                        //find posting in augmented list
                        let postingId = element.dataset.postingid;
                        showDetailsSidebar(postingId, element)
                    }
                },
                customHandlers: [deletePost, dropdownMenus, showParticipant, postDetails, assignCurrentUser, unassignPost]
            }



            let listContainer = document.getElementById("userlist-container--participants")
            let scrollableList = new ScrollableList(listContainer, "postings", sortedList, scrollArgs, callback)

            return scrollableList;

            function showDetailsSidebar(postingId, element) {
                let augmentedPosting = sortedList.find(e => e._id.toString() === postingId);

                sidebar.addContent("showPostingDetails", {
                    postingId: postingId,
                    augmentedPosting: augmentedPosting,
                    event: self.pageData.event,
                    allowEdit: args.allowEdit,
                    user: self.pageData.user,
                    userIsAllowed: element.dataset.userisallowed,
                    userIsRegistered: isRegistered,
                    callback: {
                        onConfirm: function(data, localArgs){
                            let posting = data;
                            eventActions.updatePosting(event.id, posting, function(event){
                                eventProfile.refreshEvent()
                                    .then(event => {
                                        self.pageData.event = event;
                                        userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
                                        self.dataList =self.pageData.event.postings;
                                        displayPostingsList(self.dataList);
                                        self.searchbar.hide();
                                        let newPosting = event.postings.find(posting => posting._id.toString() === postingId);
                                        let newAugmentedPosting = Object.assign(augmentedPosting, newPosting)
                                        sidebar.update({event: event, isParticipant: userIsParticipant, augmentedPosting: newAugmentedPosting});
                                    })
                                    .catch(err => {
                                    })
                            }, {
                                date: localArgs.date,
                                startTime: localArgs.startTime,
                                endTime: localArgs.endTime,
                            }).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
                        },
                        onDelete: function(data){
                            let postingId = data.id;
                            //push changes to server
                            deletePosting(self.pageData.event, postingId)
                        },
                        onAssign: function(data) {
                            let event = data.event;
                            let postingId = data.postingId;
                            let userId = data.userId;
                            assignUser(event, postingId, userId);
                        },
                        onUnassign: function(data) {
                            let event = data.event;
                            let postingId = data.postingId;
                            let userId = data.userId;
                            unassignUser(event, postingId, userId);

                        }
                    }
                });
                sidebar.show();
            }

            function assignUser(event, postingId, userId){
                let augmentedPosting = sortedList.find(e => e._id.toString() === postingId);
                eventActions.assignPost(event.id, postingId, userId, function(){
                    eventProfile.refreshEvent()
                        .then(event => {
                            self.pageData.event = event;
                            self.dataList = self.pageData.event.postings;
                            displayPostingsList(self.dataList);
                            self.searchbar.hide();
                            let newPosting = event.postings.find(posting => posting._id.toString() === postingId);
                            let newAugmentedPosting = Object.assign(augmentedPosting, newPosting)
                            sidebar.update({event: event, augmentedPosting: newAugmentedPosting});
                        })
                        .catch(err => {
                        })
                }).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
            }

            function unassignUser(event, postingId, userId) {
                let augmentedPosting = sortedList.find(e => e._id.toString() === postingId);
                eventActions.unassignPost(event.id, postingId, userId, function () {
                    eventProfile.refreshEvent()
                        .then(event => {
                            self.pageData.event = event;
                            self.dataList = self.pageData.event.postings;
                            displayPostingsList(self.dataList);
                            self.searchbar.hide();
                            let newPosting = event.postings.find(posting => posting._id.toString() === postingId);
                            let newAugmentedPosting = Object.assign(augmentedPosting, newPosting)
                            sidebar.update({event: event, augmentedPosting: newAugmentedPosting});
                        })
                        .catch(err => {
                        })
                }).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
            }

            function deletePosting(event, postingId){
                eventActions.removePosting(event.id, postingId, function(){
                    eventProfile.refreshEvent()
                        .then(event => {
                            self.pageData.event = event;
                            self.dataList = event.postings;
                            displayPostingsList(self.dataList);
                            self.searchbar.hide();
                            sidebar.showDefault();
                        })
                        .catch(err => {
                        })
                }).fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
            }
        }

    },
    updatePage: function(user, event, args) {
        this.buildPage(user, event, args)
    }
};

let qualTypesMap = {
    SAN: "Sanitätsdienst",
    FUEHRUNG: "Einsatzführung",
    NACHWEIS: "Nachweis",
    AUSBILDUNG: "Ausbildung",
}

export {eventParticipants}