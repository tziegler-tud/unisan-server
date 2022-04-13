import "./eventsOld.scss";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Calendar} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import deLocale from "@fullcalendar/core/locales/de";

var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");

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

                $('.radio-item').checkboxradio({
                    icon: false
                });
                let checked= $('input[name=eventlist-radio]:checked');
                let listRadio = $("#eventlist01");
                let calendarRadio = $("#eventlist02");
                listRadio.on("change", function(){
                    if (self.view === "calendar") {
                        self.view = "list";
                        self.show()
                    }
                });
                calendarRadio.on("change", function(){
                    if (self.view === "list") {
                        self.view = "calendar";
                        self.show()
                    }
                })
                self.view = "list";
                //try to recreate checked state across page reloads
                if (checked.val()){
                    self.view = checked.val();
                }
                self.sort = "date.startDate";
                self.calendar = null;
                self.list = null;
                self.data = {};
                self.listContainer = document.getElementById('eventlist-container');
                self.calendarContainer = document.getElementById('eventcalendar-container');

                //setup searchbar
                let searchbarContainer = document.getElementById("usersearch");
                var searchbar = new common.Searchbar(searchbarContainer, {
                    onInput: {
                        enabled: true,
                        callback: function(inputValue){
                            self.getData(window.userId, inputValue, self.sort)
                                .then(data => {
                                    self.data = data;
                                    self.show(data);
                                    resolve(self)
                                })
                                .catch(err => {
                                    reject(err)
                                })
                        },
                    },
                });
                getData(window.userId, "", self.sort)
                    .then(data => {
                        self.data = data;
                        self.show(data);
                        resolve(self)
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
        })

    },
    show: function() {
        let self = this;
        this.initPromise.then(init => {
            let events = self.data;
            switch (this.view) {
                case "list":
                    self.calendar = null;
                    self.list = displayEventList(events, self.list, self.listContainer, self.sort);
                    self.listContainer.classList.remove("hidden");
                    self.calendarContainer.classList.add("hidden");
                    break;
                case "calendar":
                    self.list = null;
                    self.listContainer.classList.add("hidden");
                    self.calendarContainer.classList.remove("hidden");
                    self.calendar = displayCalendar(events, self.calendar, self.calendarContainer);

                    break;
                default:
                    self.calendar = null;
                    self.list = null;
                    console.error("invalid view option: " + this.view);
            }
        })
            .catch(err => {
                console.error("Failed to show events: Module not initialized: " + err)
            })

    },
    update: function() {
        let self = this;
        this.initPromise.then(init => {
            let events = self.data;
            switch (this.view) {
                case "list":
                    self.calendar = null;
                    self.list = displayEventList(events, self.list, self.sort,);
                    break;
                case "calendar":
                    self.calendar = displayCalendar(events, self.calendar);
                    self.list = null;
                    break;
                default:
                    self.calendar = null;
                    self.list = null;
                    console.error("invalid view option: " + this.view);
            }
        })
        .catch(err => {
            console.error("Failed to show events: Module not initialized: " + err)
        })
    }
};

function getData(userid, filter, sort){

    let url;
    let dateFilterObj = {
        // selector: "gte"
    }
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

function displayEventList(events, list, container, sort){
    let args = {
        height: "full",
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

            }
        }
    }
    let scrollableList = new ScrollableList(container, "event", events, args, callback)
    return scrollableList;
}

function displayCalendar(events, calendar, container){
    let calendarEvents = events.map(function(event){
        return {
            id: event.id,
            title: event.title.value,
            type: event.type.value,
            typeIndex: event.type.index,
            groupId: event.id,
            start: event.date.startDate,
            end: event.date.endDate,
            url: "/unisams/events/view/"+event.id,
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
        calendar = new Calendar(container, {
            plugins: [ dayGridPlugin, timeGridPlugin, listPlugin ],
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listMonth'
            },
            locale: deLocale,
            height: "auto",
            aspectRatio: 2,
            eventSources: eventSources,
        });

    }
    else {
        //update existing.
        calendar.removeAllEventSources();
        eventSources.forEach(source => {
            calendar.addEventSource(source)
        })
    }

    calendar.render();
    return calendar;
}

export {events}