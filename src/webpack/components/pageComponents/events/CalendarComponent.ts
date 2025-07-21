import ComponentPage from "../../ComponentPage.js";
import Component, {ComponentOptionArgs, ComponentOptionData, ComponentOptions} from "../../Component";
import { Calendar } from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import eventActions from "../../../actions/eventActions";
import {eventPlugin} from "../../../sidebar/plugins/plugin-event";
import calendarPlugin from "../../../sidebar/plugins/plugin-calendar";

import "../../scss/events/CalendarComponent.scss"
import {IEvent} from "../../../types/Event";

interface CalendarComponentOptions {
    page: ComponentPage;
    section: any;
    componentId?: string;
    pageData?: any;
    data?: CalendarComponentData;
    args?: ComponentOptionArgs
}

interface CalendarComponentData {
    user?: any;
    allowCreateEvent?: boolean;
}

export default class CalendarComponent extends Component {
    protected data: CalendarComponentData;
    protected templateUrl: string;
    private events: IEvent[]
    private calendar: Calendar | null;
    private selectedElem: HTMLElement | null = null;
    private htmlDayElems: NodeListOf<HTMLElement>;
    private allowCreateEvent: boolean = false;

    /**
     * Calendar component constructor
     */
    constructor(options: CalendarComponentOptions) {
        super({
            page: options.page,
            section: options.section,
            componentId: options.componentId,
            pageData: options.pageData,
            data: {
                user: options.data.user,
                targetUser: undefined,
            },
            args: options.args,
        });
        this.data = options.data || {};

        if(options.data){
            if(options.data.allowCreateEvent) {
                this.allowCreateEvent = true;
            }
        }

        this.templateUrl = "/webpack/components/templates/events/calendar.hbs";
        this.calendar = null;
    }

    private getEventById(id: string): IEvent | undefined {
        return this.events.find((event) => event.id.toString() === id);
    }

    async postRender(): Promise<void> {
        this.page.sidebar.addPlugin(eventPlugin)
        this.page.sidebar.addPlugin(calendarPlugin)
        const calendarContainer: HTMLElement | null = document.getElementById("calendar-container");
        try {
            this.events = await eventActions.getEvents({})
        }
        catch(e){
            //show snackbar
        }
        let calendarEvents = this.events.map(function(event){
            return {
                id: event.id.toString(),
                title: event.title.value,
                groupId: event.type.index.toString(),
                // description: event.dateRangeString + "\n " + event.type.value,
                typeIndex: event.type.index,
                start: event.date.startDate,
                end: event.date.endDate,
                classNames: ["unisan-event", "unisan-event__clickable"]
            }
        })


        if (calendarContainer) {
            this.calendar = new Calendar(calendarContainer, {
                plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin],
                initialView: 'dayGridMonth',
                height: 500,
                aspectRatio: 6,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                },
                // selectable: true,
                events: calendarEvents,
                select: (info) => {
                    // this.page.sidebar.addContent("viewDate", {
                    //     startDate: info.start,
                    //     endDate: info.start,
                    // });
                    // this.page.sidebar.show();
                },
                dateClick: (info) => {
                    // this.page.sidebar.addContent("viewDate", {
                    //     startDate: info.date,
                    //     endDate: info.date,
                    // });
                    // this.page.sidebar.show();
                    // info.dayEl.style.backgroundColor="#aaeaff"
                    this.htmlDayElems.forEach(elem => {
                        elem.classList.remove("calendar--selected")
                    })
                    info.dayEl.classList.add("calendar--selected");

                },
                eventClick: (info) => {
                    //get event from id
                    const event = this.getEventById(info.event.id);
                    if(!event) {
                        this.page.snackbar.showCustomError("Ein Fehler ist aufgetreten.", "Error")
                    }

                    this.page.sidebar.addContent("viewEvent", {
                        event: event,
                    });
                    this.page.sidebar.show();
                    // change the border color just for fun
                    info.el.style.borderColor = 'red';
                }
            });
            this.calendar.render();

            this.htmlDayElems = document.querySelectorAll(".fc-day")


            //add dblclick event listener
            if(this.allowCreateEvent){
                this.htmlDayElems.forEach(elem => {
                    const date = elem.dataset.date;
                    elem.addEventListener("dblclick", ()=>{
                        //create event
                        let url = "/events/addEvent"
                        if(date) url+="?startDate="+date
                        window.location.href=url;
                    })
                });
            }

            let seminars = calendarEvents.filter(event => event.typeIndex === 0);
            let train = calendarEvents.filter(event => event.typeIndex === 1);
            let san = calendarEvents.filter(event => event.typeIndex === 2);
            let others = calendarEvents.filter(event => event.typeIndex === 3);
        }
    }

    getHtml(): string {
        return this.html;
    }
}