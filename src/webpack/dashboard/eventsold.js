import "./events.scss";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";
import {dateFromNow} from "../helpers/helpers";

var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";

import "/lib/evo-calendar/evo-calendar/js/evo-calendar.js";
import ComponentPage from "../components/ComponentPage";
import {UserProfile} from "../userprofile/userprofile";

let events = {
    title: "events",
    data: {},
    init: async function () {
        let self = this;
        var currentUserProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);
        var ob1 = new lidlObserver((u) => {
            this.pageData.user = u;
        });
        //debug line, remove before flight
        console.log("loading js module: dashboard."+self.title);

        self.view = "both";
        self.sort = "date.startDate";
        self.calendar = null;
        self.upcomingList = null;
        self.pastList = null;
        self.data = {all: [], upcoming: [], past: []};
        self.calendarContainer = document.getElementById('eventcalendar-container');

        const currentUser = await currentUserProfile.getUserAndSubscribe(ob1);

        const data = {
            user: currentUser,
            targetUser: currentUser,
        }

        let pageContainer = document.getElementById("userPage-component-container");
        var componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: undefined,
            data: data,
            args: {},
        });
        window.componentPage = componentPage;
        await componentPage.addComponent({
            componentType: ComponentPage.componentTypes.USER.EVENTS,
            componentArgs: {allowEdit: true, size: "full"},
            data: {user: data.user, targetUser: data.targetUser}
        })

        self.getData(window.userId, "", self.sort)
            .then(all => {
                self.data.all = all;
                self.showCalendar();
            })
            .catch(err => {
                throw err
            })
    },

    showCalendar: function(){
        let self = this;
        let events = self.data.all;
        self.calendar = displayCalendar(events, self.calendar, self.calendarContainer);
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
            window.location = "/events/view/"+activeEvent.id;
        });
        $(container).on('selectDate', function(domEvent, activeDate, oldDate) {

        })

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