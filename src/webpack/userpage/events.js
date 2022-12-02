import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {UserProfile} from "../userprofile/userprofile";

import {userActions, eventActions, groupActions} from "../actions/actions"

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";

import {DropdownMenu} from "../helpers/dropdownMenu";
import {dateFromNow} from "../helpers/helpers";
import {phone, tablet} from "../helpers/variables";
import {Snackbar} from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";

var actions = window.actions;


let events= {
    title: "events",
    pageData: {},
    init: function (args) {
        let self  = this;
        self.initPromise = new Promise(function(resolve, reject){
            $(document).ready(function () {

                //debug line, remove before flight
                console.log("loading js module: user."+self.title);

                self.pageData = {};
                var lidlRTO = window.lidlRTO;
                var currentExploredUser;
                var profile = new UserProfile(window.exploreUserId);

                // create new observer
                var ob1 = new lidlObserver(function (u) {
                    currentExploredUser = u;
                    self.pageData.exploredUser = currentExploredUser;
                    self.updatePage(self.pageData.exploredUser, args)
                });
                window.snackbar = new Snackbar();

                const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});


                // get user data from user service
                //subscribe as observer to get notification if user changes on server
                let userPromise = profile.getUserAndSubscribe(ob1);

                userPromise.then(user=> {
                    self.pageData.exploredUser = user;
                    self.buildPage(self.pageData.exploredUser, args)
                        .then(result => {
                            resolve();
                        })
                        .catch(err=> {
                            reject(err)
                        })
                    })
                    .catch(function (reason) {
                        console.error("Failed to retrieve data:" + reason)

                    })
            })
        })
    },
    buildPage: function(user, args) {
        let self = this;
        var lidlRTO = window.lidlRTO;

        // var sidebar = new Sidebar('wrapper', {title: "test"});
        // sidebar.addPlugin(userPlugin);
        //
        // sidebar.addContent("user", {
        //     userid: self.pageData.user.id,
        // });
        // if(phone.matches || tablet.matches) {
        //     sidebar.hide();
        // }
        // else {
        //     sidebar.show();
        // }
        return new Promise(function(resolve, reject){

            if (window.allowedit) {
                window.DockerElement.addDockerSubPage("userEdit", self.pageData.exploredUser, {}, undefined, {currentUser: {edit: window.allowedit}});
            }
            else {
                window.DockerElement.addDockerSubPage("user", self.pageData.exploredUser, {}, undefined, {currentUser: {edit: window.allowedit}});
            }


            self.sort = "date.startDate";
            self.upcomingList = null;
            self.pastList = null;
            self.data = {upcoming: [], past: []};
            self.upcomingListContainer = document.getElementById('eventlist-container--upcoming');
            self.pastListContainer = document.getElementById('eventlist-container--past');
            self.searchbarContainerUpcoming = document.getElementById("eventsearch--upcoming");
            self.searchbarContainerPast = document.getElementById("eventsearch--past");

            //setup searchbar
            self.searchbarUpcoming = new Searchbar(self.searchbarContainerUpcoming, {
                onInput: {
                    enabled: true,
                    callback: function(inputValue){
                        self.getEvents(self.pageData.exploredUser.id, {matchString: inputValue, dateFilter: {selector: "gte"}, sort: self.sort})
                            .then(data => {
                                self.data.upcoming = data;
                                self.showUpcoming();
                                resolve(self)
                            })
                            .catch(err => {
                                reject(err)
                            })
                    },
                },
            });
            let filterDate = dateFromNow({weeks: -4});
            self.searchbarUpcoming = new Searchbar(self.searchbarContainerPast, {
                onInput: {
                    enabled: true,
                    callback: function(inputValue){
                        self.getEvents(self.pageData.exploredUser.id, {matchString: inputValue, dateFilter: {selector: "range", minDate: filterDate}, sort: self.sort})
                            .then(data => {
                                self.data.past = data;
                                self.showPast();
                                resolve(self)
                            })
                            .catch(err => {
                                reject(err)
                            })
                    },
                },
            });

            let upcoming = self.getEvents(self.pageData.exploredUser.id, {dateFilter: {selector: "gte"}, sort: self.sort})
            let past = self.getEvents(self.pageData.exploredUser.id, {dateFilter: {selector: "range", minDate: filterDate}, sort: self.sort})

            Promise.all([upcoming, past])
                .then(dataArray => {
                    self.data.upcoming = dataArray[0];
                    self.data.past = dataArray[1];
                    self.showUpcoming();
                    self.showPast();
                    resolve(self)
                })

                .catch(err => {
                    reject(err)
                })
        })

    },
    updatePage: function(user, args){
        this.buildPage(user, args)
    },
    showUpcoming: function(){
        let self = this;
        this.initPromise.then(init => {
            let upcoming = self.data.upcoming;
            self.upcomingList = displayEventList(upcoming, self.upcomingListContainer, self.sort);
            // self.searchbarUpcoming.show();
        })
            .catch(err => {
                console.error("Failed to show events: Module not initialized: " + err)
            })
    },
    showPast: function(){
        let self = this;
        this.initPromise.then(init => {
            let past = self.data.past;
            self.pastList = displayEventList(past, self.pastListContainer, self.sort);
            // self.searchbarUpcoming.show();
        })
            .catch(err => {
                console.error("Failed to show events: Module not initialized: " + err)
            })
    },
    getEvents: function (userid, options){
        let self = this;
        let defaultOptions = {
            filter: {},
            matchString: "",
            dateFilter: {},
        }
        options = Object.assign(defaultOptions, options)
        let url;
        let dateFilterObj = options.dateFilter;
        let userFilter = {
            filter: "participants.user",
            value: userid
        }
        let data = {
            userid: userid,
            matchString: options.matchString,
            filter: options.filter,
            args: {
                sort: options.sort,
                dateFilter: dateFilterObj,
                filter: userFilter,
            }};
        //get user list from server
        return new Promise(function(resolve, reject){
            $.ajax({
                url: "/api/v1/eventmod/userevents/",
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(events) {
                    resolve(events)
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
                    reject(errorThrown)
                }
            });
        })
    },
};

function displayEventList(events, container, sort){
    if (sort === undefined) sort = "date.startDate";
    let args = {
        height: "fixed",
        fixedHeight: "500px",
        sorting: {
            property: sort,
            direction: 1,
        }
    }
    let callback = {
        listItem: {
            onClick: function(e){
                let self = e.currentTarget;
                e.preventDefault();
                window.location = "/unisams/events/view/"+self.dataset.id;

            }
        }
    }

    return new ScrollableList(container, "event", events, args, callback)
}

export {events}