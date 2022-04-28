import "./events.scss";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";
import {dateFromNow} from "../helpers/helpers";

var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");
import "/src/lib/evo-calendar/evo-calendar/js/evo-calendar.js";

var common = window.common;
var actions = window.actions;

let events = {
    data: {},
    init: function () {
        let self = this;
        self.initPromise = new Promise(function(resolve, reject){
            $(document).ready(function () {

                //debug line, remove before flight
                console.log("loading js module: dashboard.events");

                self.view = "both";
                self.sort = "-date.startDate";
                self.calendar = null;
                self.upcomingList = null;
                self.pastList = null;
                self.data = {all: [], upcoming: [], past: []};
                self.upcomingListContainer = document.getElementById('eventlist-container--upcoming');
                self.pastListContainer = document.getElementById('eventlist-container--past');
                self.calendarContainer = document.getElementById('eventcalendar-container');

                //setup searchbar
                let searchbarUpcoming = document.getElementById("eventsearch-upcoming");
                self.searchbarUpcoming = new Searchbar(searchbarUpcoming, {
                    onInput: {
                        enabled: true,
                        callback: function(inputValue){
                            self.getData(window.userId, inputValue, {selector: "gte"}, self.sort)
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
                let searchbarPast = document.getElementById("eventsearch-past");
                let filterDate = dateFromNow({weeks: -4});
                self.searchbarUpcoming = new Searchbar(searchbarPast, {
                    onInput: {
                        enabled: true,
                        callback: function(inputValue){
                            self.getData(window.userId, inputValue, {selector: "range", minDate: filterDate}, self.sort)
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

                let all = self.getData(window.userId, "", self.sort);
                let upcoming = self.getData(window.userId, "", {selector: "gte"}, self.sort);
                let past = self.getData(window.userId, "", {selector: "range", minDate: filterDate}, self.sort);

                Promise.all([all, upcoming, past])
                    .then(dataArray => {
                        self.data.all = dataArray[0];
                        self.data.upcoming = dataArray[1];
                        self.data.past = dataArray[2];
                        self.showCalendar();
                        self.showUpcoming();
                        self.showPast();
                        resolve(self)
                    })

                    .catch(err => {
                        reject(err)
                    })
            })
        })

    },
    showUpcoming: function(){
        let self = this;
        this.initPromise.then(init => {
            let events = self.data.all;
            let upcoming = self.data.upcoming;
            self.upcomingList = displayEventList(upcoming, self.upcomingList, self.upcomingListContainer, self.sort);
            // self.searchbarUpcoming.show();
        })
            .catch(err => {
                console.error("Failed to show events: Module not initialized: " + err)
            })
    },
    showPast: function(){
        let self = this;
        this.initPromise.then(init => {
            let events = self.data.all;
            let past = self.data.past;
            self.pastList = displayEventList(past, self.pastList, self.pastListContainer, self.sort);
            // self.searchbarUpcoming.show();
        })
            .catch(err => {
                console.error("Failed to show events: Module not initialized: " + err)
            })
    },
    showCalendar: function(){
        let self = this;
        this.initPromise.then(init => {
            let events = self.data.all;
            self.calendar = displayCalendar(events, self.calendar, self.calendarContainer);
        })
            .catch(err => {
                console.error("Failed to show events: Module not initialized: " + err)
            })
    },
    getData: function (userid, filter, dateFilter, sort){
        let self = this;
        let url;
        if (dateFilter === undefined) dateFilter = {}
        let dateFilterObj = dateFilter;
        let userFilter = {
            filter: "participants.user",
            value: userid
        }
        let data = {
            filter: filter,
            args: {
                sort: sort,
                dateFilter: dateFilterObj,
                filter: userFilter,
            }};
        //get user list from server
        return new Promise(function(resolve, reject){
            $.ajax({
                url: "/api/v1/eventmod/filter",
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
    }
};



function displayEventList(events, list, container, sort){
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

    let scrollableList = new ScrollableList(container, "event", events, args, callback)
    return scrollableList;
}

function displayCalendar(events, calendar, container){
    let typeMap = {
        0: "event",
        1: "holiday",
        2: "birthday",
        3: "birthday",
    }
    let calendarEvents = events.map(function(event){
        return {
            id: event.id,
            name: event.title.value,
            type: typeMap[event.type.index],
            description: event.dateRangeString + "\n " + event.type.value,
            typeIndex: event.type.index,
            date: event.date.startDate,
            // url: "/unisams/events/view/"+event.id,
        }
    })

    let seminars = calendarEvents.filter(event => event.typeIndex === 0);
    let train = calendarEvents.filter(event => event.typeIndex === 1);
    let san = calendarEvents.filter(event => event.typeIndex === 2);
    let others = calendarEvents.filter(event => event.typeIndex === 3);

    let eventSources =  [
        {
            events: seminars,
            color: '#66b9e0',     // an option!
            textColor: 'black' // an option!
        },
        {
            events: train,
            color: '#f8cc5b',     // an option!
            textColor: 'black' // an option!
        },
        {
            events: san,
            color: '#de243d',     // an option!
            textColor: 'black' // an option!
        },
        {
            events: others,
            color: '#30de24',     // an option!
            textColor: 'black' // an option!
        },
    ];


    if (!calendar) {
        container.innerHTML = "";
        //create new calendar
        calendar = $(container).evoCalendar({
            // format: "dd.mm.yyyy",
            eventHeaderFormat: "dd. MM yyyy",
            language: "de",
            firstDayOfWeek: 1,
            todayHighlight: true,
            theme: 'unisan',
            calendarEvents: calendarEvents,
                // {
                //     id: 'bHay68s', // Event's ID (required)
                //     name: "New Year", // Event name (required)
                //     date: "January/1/2020", // Event date (required)
                //     type: "holiday", // Event type (required)
                //     everyYear: true // Same event every year (optional)
                // },
                // {
                //     name: "Vacation Leave",
                //     badge: "02/13 - 02/15", // Event badge (optional)
                //     date: ["February/13/2020", "February/15/2020"], // Date range
                //     description: "Vacation leave for 3 days.", // Event description (optional)
                //     type: "event",
                //     color: "#63d867" // Event custom color (optional)
                // }
        });
        $(container).on('selectEvent', function(domEvent, activeEvent, b, c) {
            window.location = "/unisams/events/view/"+activeEvent.id;
        });

        // $(container).evoCalendar('addCalendarEvent', calendarEvents);

    }
    else {
        //update existing.
        // calendar.removeAllEventSources();
        // eventSources.forEach(source => {
        //     calendar.addEventSource(source)
        // })
    }
    return calendar;
}

export {events}