import ComponentPage from "../../ComponentPage.js";
import Component, {ComponentOptions} from "../../Component";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import eventActions, {Event} from "../../../actions/eventActions";


interface CalendarComponentData {
    user?: any;
    targetUser?: string | object;
    args?: any;
}

export default class CalendarComponent extends Component {
    protected data: CalendarComponentData;
    protected templateUrl: string;
    private calendar: Calendar | null;

    /**
     * Calendar component constructor
     * @param options {ComponentOptions} The options object
     */
    constructor(options: ComponentOptions) {
        super(options);
        this.data = options.data || {};

        if (this.data.targetUser === "current") {
            this.data.targetUser = this.data.user;
        }

        if (this.data.targetUser === undefined) {
            throw new Error("Invalid Arguments received: targetUser cannot be undefined.");
        }

        this.templateUrl = "/webpack/components/templates/events/calendar.hbs";
        this.calendar = null;
    }

    async postRender(): Promise<void> {
        const calendarContainer: HTMLElement | null = document.getElementById("calendar-container");
        let events: Event[] = [];
        try {
            events = await eventActions.getEvents({})
        }
        catch(e){
            //show snackbar
        }

        let calendarEvents = events.map(function(event){
            return {
                id: event.id,
                title: event.title.value,
                groupId: event.type.index.toString(),
                // description: event.dateRangeString + "\n " + event.type.value,
                typeIndex: event.type.index,
                start: event.date.startDate,
                end: event.date.endDate,
                url: "/unisams/events/view/"+event.id,
            }
        })


        if (calendarContainer) {
            this.calendar = new Calendar(calendarContainer, {
                plugins: [dayGridPlugin, timeGridPlugin],
                initialView: 'dayGridMonth',
                height: 500,
                aspectRatio: 6,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                },
                events: calendarEvents
            });
            this.calendar.render();


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