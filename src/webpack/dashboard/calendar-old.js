import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import deLocale from '@fullcalendar/core/locales/de';


let notifications = {
    init: function () {
        $(document).ready(function () {

            var actions = window.actions;

            //debug line, remove before flight
            console.log("loading js module: dashboard.notifications");
            displayCalendar(window.userid, "");

        })
    }
};

function displayCalendar(userid, filter) {
    var handleData = {};
    let sort = "date.startDate";
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
    $.ajax({
        url: "/api/v1/eventmod/filter",
        type: 'POST',
        contentType: "application/json; charset=UTF-8",
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(events) {
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
            let calendarEvents = events.map(function(event){
                return {
                    id: event.id,
                    title: event.title.value,
                    groupId: event.type.value,
                    start: event.date.startDate,
                    end: event.date.endDate,
                }

            })
            var calendarEl = document.getElementById('calendar');
            let calendar = new Calendar(calendarEl, {
                plugins: [ dayGridPlugin, timeGridPlugin, listPlugin ],
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listWeek'
                },
                locale: deLocale,
                eventSources: [

                    // your event source
                    {
                        events: calendarEvents,
                        // color: 'black',     // an option!
                        // textColor: 'yellow' // an option!
                    }

                    // any other event sources...

                ]
            });
            calendar.render();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
        }
    });
}

export {notifications}