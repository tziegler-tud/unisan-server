import {UserProfile} from "../userprofile/userprofile";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";

import {DropdownMenu} from "../helpers/dropdownMenu";
import {dateFromNow} from "../helpers/helpers";
import {Snackbar} from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import PageModule from "../utils/PageModule";

var actions = window.actions;


export default new PageModule ({
    title: "user.events",
    pageData: {},
    init: async function (args) {
        var currentExploredUser;
        var currentUserProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);
        var targetUserProfile = new UserProfile(window.exploreUserId);

        // create new observer
        var ob1 = new lidlObserver((u) => {
            this.pageData.user = u;
        });

        var ob2 = new lidlObserver((u) => {
            this.pageData.exploredUser = u;
        });
        window.snackbar = new Snackbar();

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});


        // get user data from user service
        //subscribe as observer to get notification if user changes on server
        let userPromise = profile.getUserAndSubscribe(ob1);

        const currentUser = await currentUserProfile.getUserAndSubscribe(ob1);
        const targetUser = await targetUserProfile.getUserAndSubscribe(ob1);


        const data = {
            user: currentUser,
            targetUser: this.pageData.exploredUser
        }

        return {args, data}

    },
    buildPage: async function({args={}, data={}}={}) {
        let self = this;
        var lidlRTO = window.lidlRTO;

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

        self.data.upcoming = await self.getEvents(self.pageData.exploredUser.id, {dateFilter: {selector: "gte"}, sort: self.sort})
        self.data.past = await self.getEvents(self.pageData.exploredUser.id, {dateFilter: {selector: "range", minDate: filterDate}, sort: self.sort})

        self.showUpcoming();
        self.showPast();

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
});

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