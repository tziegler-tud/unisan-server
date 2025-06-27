import Component from "../../Component";
import ComponentPage from "../../ComponentPage";
import ScrollableList, {ScrollableListArgs} from "../../../scrollableList/ScrollableList";
import Searchbar from "../../../widgets/searchbar/SearchBar";
import {IEventBlueprint, IBlueprintPosting} from "../../../types/EventBlueprint";
import {DropdownMenu} from "../../../helpers/dropdownMenu";
import {Corner} from "@material/menu";
import eventFactoryPlugin, {ShowPostingConfirmPayload} from "../../../sidebar/plugins/plugin-eventfactory";
import eventBlueprintActions from "../../../actions/eventBlueprintActions";
import EventBlueprintProfile from "../../../eventFactory/EventBlueprintProfile";
import DisplaySelector, {DisplaySelectorEventData} from "../../../widgets/DisplaySelector/DisplaySelector";
import {Calendar} from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

import "../../scss/events/EventPostingsComponent.scss"
import {IQualification} from "../../../types/Qualification";

interface ComponentArgs {
    page: ComponentPage;
    section: any;
    componentId: string;
    pageData?: any;
    data?: {
        user: any;
        event: IEventBlueprint
    };
    args?: any;
}

interface SearchbarArgs {
    onInput: {
        enabled: boolean;
        callback: (inputValue: string) => Promise<void>;
    };
}

interface ScrollableListCallback {
    listItem: {
        onClick: (e: MouseEvent) => void;
    };
}

export default class EventFactoryPostingsComponent extends Component {
    dataset: any;

    /**
     *
     * @param options {ComponentArgs} Component initialization options
     * @constructor
     */
    constructor({
                    page,
                    section,
                    componentId,
                    pageData = {},
                    data,
                    args = {}
                }: ComponentArgs) {
        super({ page, section, componentId, pageData, data, args });

        this.event = this.data.event;
        this.templateUrl = "/webpack/components/templates/eventfactory/postingsList.hbs";
        this.allowEdit = args.allowEdit;

        this.eventProfile = new EventBlueprintProfile(this.event.id);
    }

    private event: IEventBlueprint;

    private viewConfig!: { sort: string; order: string };
    private eventData!: {
        list: IEventBlueprint[];
    };
    private listContainer: HTMLElement | null;
    private calendarContainer: HTMLElement | null;
    private searchbar!: Searchbar;
    private dataList: IBlueprintPosting[] = [];
    private displayList?: IBlueprintPosting[] = null;
    private eventProfile: EventBlueprintProfile
    private allowEdit: boolean;
    private calendar: Calendar;
    private cardsList: ScrollableList;

    private calendarEventStartTimeString: string;
    private calendarEventEndTimeString: string;

    private currentView: "cards" | "calendar" | "resources";


    async postRender(): Promise<void> {
        this.viewConfig = { sort: "date.startDate", order: "desc" };
        this.cardsList = null;
        this.listContainer = document.getElementById('eventPostingsComponent--list');
        this.calendarContainer = document.getElementById('eventPostingsComponent--calendar');

        await this.refreshEvent();

        const eventStartDate = new Date(this.event.date.startDate)
        const eventEndDate = new Date(this.event.date.endDate)

        this.calendarEventStartTimeString = `${this._normalizeTime(eventStartDate.getHours()-1)}:${this._normalizeTime(eventStartDate.getMinutes())}:00`
        this.calendarEventEndTimeString = `${this._normalizeTime(eventEndDate.getHours()+1)}:${this._normalizeTime(eventEndDate.getMinutes())}:00`

        this.page.sidebar.addPlugin(eventFactoryPlugin);

        //setup view mode toggle
        const topbar_container = this.container.querySelector(".eventPostingsComponent--displaySelector") as HTMLElement;
        let displaySelector = new DisplaySelector(topbar_container,
            [
                {
                    uid: 1,
                    value: "cards",
                    active: false,
                    icon: "cards",
                },
                {
                    uid: 2,
                    value: "calendar",
                    active: false,
                    icon: "calendar",
                },
                {
                    uid: 3,
                    value: "resources",
                    active: false,
                    icon: "resources",
                },
            ])

        displaySelector.setActiveElement(1);

        displaySelector.listen("displaySelectorElementChanged", (eventData: DisplaySelectorEventData)=>{
            switch(eventData.value){
                case "cards":
                    this.showCards();
                    break;
                case "calendar":
                    this.showCalendar();
                    break;
                case "resources":
                    this.showResources();
                    break;

            }
        })

        //setup searchbar
        let searchbar = document.getElementById("eventPostingsComponent--searchbar");
        this.searchbar = new Searchbar(searchbar, {
            onInput: {
                enabled: true,
                callback: (inputValue)=> {
                    let filteredList = [];
                    if(!inputValue) filteredList = this.dataList;
                    else {
                        filteredList = this._filterPostingsList(this.dataList, inputValue);
                    }
                    this.displayList = filteredList
                    this.reloadCurrentView()
                },
            },
        });

        this.displayList = this.dataList;
        this.showCards();
    }

    _filterPostingsList(postingsList: IBlueprintPosting[], inputValue: string): IBlueprintPosting[] {
        return postingsList.filter((posting)=>{
            return posting.requiredQualifications.some((qual: IQualification) => {
                return qual.name.includes(inputValue) || qual.short.includes(inputValue)
            })
        })
    }

    getHtml(): string {
        return this.html;
    }

    showCalendar(){

        this.currentView = "calendar";
        this.listContainer.innerHTML = "";

        const calendarEvents = this._getCalendarEvents();
        const resources = this._getCalendarResources();

        if (this.calendarContainer) {
            this.calendar = new Calendar(this.calendarContainer, {
                customButtons: {
                    dienstplanButton: {
                        text: 'Dienstplan',
                    }
                },
                schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
                plugins: [interactionPlugin, resourceTimelinePlugin, resourceTimeGridPlugin],
                initialView: 'resourceTimeline',
                height: 500,
                resources: resources,
                slotMinTime: this.calendarEventStartTimeString,
                slotMaxTime: this.calendarEventEndTimeString,
                //aspectRatio: 6,
                headerToolbar: {
                    left: '',
                    center: '',
                    right: '',
                },
                // selectable: true,
                events: calendarEvents,
                // select: (info) => {
                //     const postingId = info.
                //     this.showDetailsSidebar()
                // },
                // dateClick: (info) => {
                //     // this.page.sidebar.addContent("viewDate", {
                //     //     startDate: info.date,
                //     //     endDate: info.date,
                //     // });
                //     // this.page.sidebar.show();
                //     // info.dayEl.style.backgroundColor="#aaeaff"
                //
                //     info.dayEl.classList.add("calendar--selected");
                //
                // },
                eventClick: (info) => {
                    //get event from id
                    const postingId = info.event.id;
                    if(!postingId) {
                        this.page.snackbar.showCustomError("Ein Fehler ist aufgetreten.", "Error")
                    }
                    this.showDetailsSidebar(postingId, true);
                    this.calendarContainer.querySelectorAll(".fc-event").forEach(element => {
                        element.classList.remove("calendarEvent--selected")
                    })
                    info.el.classList.add("calendarEvent--selected");
                }
            });
            this.calendar.render();


            let seminars = calendarEvents.filter(event => event.typeIndex === 0);
            let train = calendarEvents.filter(event => event.typeIndex === 1);
            let san = calendarEvents.filter(event => event.typeIndex === 2);
            let others = calendarEvents.filter(event => event.typeIndex === 3);
        }
    }

    showResources(){
        this.currentView = "resources";
        this.listContainer.innerHTML = "";
        this.calendarContainer.innerHTML = "";

        const calendarEvents = this._getCalendarEvents();
        const resources = this._getCalendarResources();

        if (this.calendarContainer) {
            this.calendar = new Calendar(this.calendarContainer, {
                customButtons: {
                    dienstplanButton: {
                        text: 'Dienstplan',
                    }
                },
                schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
                plugins: [interactionPlugin, resourceTimeGridPlugin],
                initialView: 'resourceTimeGrid',
                height: 500,
                resources: resources,
                slotMinTime: this.calendarEventStartTimeString,
                slotMaxTime: this.calendarEventEndTimeString,
                //aspectRatio: 6,
                headerToolbar: {
                    left: '',
                    center: '',
                    right: '',
                },
                // selectable: true,
                events: calendarEvents,
                // select: (info) => {
                //     const postingId = info.
                //     this.showDetailsSidebar()
                // },
                // dateClick: (info) => {
                //     // this.page.sidebar.addContent("viewDate", {
                //     //     startDate: info.date,
                //     //     endDate: info.date,
                //     // });
                //     // this.page.sidebar.show();
                //     // info.dayEl.style.backgroundColor="#aaeaff"
                //
                //     info.dayEl.classList.add("calendar--selected");
                //
                // },
                eventClick: (info) => {
                    //get event from id
                    const postingId = info.event.id;
                    if(!postingId) {
                        this.page.snackbar.showCustomError("Ein Fehler ist aufgetreten.", "Error")
                    }
                    this.showDetailsSidebar(postingId, true);
                    this.calendarContainer.querySelectorAll(".fc-event").forEach(element => {
                        element.classList.remove("calendarEvent--selected")
                    })
                    info.el.classList.add("calendarEvent--selected");
                }
            });
            this.calendar.render();


            let seminars = calendarEvents.filter(event => event.typeIndex === 0);
            let train = calendarEvents.filter(event => event.typeIndex === 1);
            let san = calendarEvents.filter(event => event.typeIndex === 2);
            let others = calendarEvents.filter(event => event.typeIndex === 3);
        }
    }

    showCards(){
        this.currentView = "cards";
        this.calendarContainer.innerHTML = "";
        let sortedList = this.displayList !== null ? this.displayList : this.dataList;
        // self.dataList = sortedList;

        let dropdownMenus = ()=> {
            $('.participant-menu-container').each(function(){
                let trigger = $(this).find(".participant-menu-button").first().get(0);
                let m = new DropdownMenu(this, "click", trigger, {anchorCorner: Corner.BOTTOM_LEFT, fixed: true})
            });
        }
        let deletePost = ()=> {
            $('.posting-delete').each(()=>{
                $(this).on("click", (e)=> {
                    //push changes to server
                    e.preventDefault();
                    e.stopPropagation();
                    let postingId = e.currentTarget.dataset.postingid;
                    this.deletePosting(postingId);
                })
            });
        }

        let postDetails = () => {
            $('.posting-details, .posting-edit').each(() =>{
                $(this).on("click", (e)=> {
                    e.preventDefault();
                    let element = e.currentTarget;
                    let postingId = element.dataset.postingid;
                    const isAllowed = element.dataset.userisallowed === "true";
                    this.showDetailsSidebar(postingId, isAllowed);
                })
            });
        }


        let scrollArgs: ScrollableListArgs = {
            height: "full",
            enableMobile: true,
            view: "cards",
            // fixedHeight: "500px",
            sorting: {
                property: "role",
                direction: 1,
            },
        }
        let callback = {
            listItem: {
                onClick:  (e: Event)=> {
                    const element = e.currentTarget as HTMLElement;
                    e.preventDefault();
                    //@ts-ignore
                    const postingId = element.dataset.postingid;
                    const isAllowed = element.dataset.userisallowed === "true";
                    this.showDetailsSidebar(postingId, isAllowed)
                }
            },
            customHandlers: [deletePost, dropdownMenus, postDetails]
        }


        this.cardsList = new ScrollableList(this.listContainer, "factoryPostings", sortedList, scrollArgs, callback)
        return this.cardsList;
    }

    showDetailsSidebar = (postingId: string, isAllowed: boolean) => {
        let augmentedPosting = this.dataList.find(e => e._id.toString() === postingId);

        this.page.sidebar.addContent("showBlueprintPostingDetails", {
            postingId: postingId,
            augmentedPosting: augmentedPosting,
            event: this.event,
            allowEdit: this.allowEdit,
            user: this.user,
            userIsAllowed: isAllowed,
            callback: {
                onConfirm: (data: ShowPostingConfirmPayload, localArgs: {})=> {
                    let posting = {
                        id: data.id,
                        requiredQualifications: data.qualifications,
                        description: data.description,
                        allowHigher: data.allowHigher,
                        optional: data.optional,
                        enabled: data.enabled,
                        assigned: {
                            isAssigned: false,
                        },
                        startTime: data.startTime,
                        endTime: data.endTime,
                    }
                    eventBlueprintActions.updatePosting(this.event.id, posting, {
                        onSuccess: ()=>{
                            this.refreshEvent()
                                .then((event: IEventBlueprint) => {
                                    this.reloadCurrentView();
                                    this.searchbar.hide();
                                    let newPosting = event.postings.find(posting => posting._id.toString() === postingId);
                                    let newAugmentedPosting = Object.assign(augmentedPosting, newPosting)
                                    this.page.sidebar.update({event: event, augmentedPosting: newAugmentedPosting});
                                    this.page.snackbar.show("Änderungen erfolgreich gespeichert.")

                                })
                                .catch((err: Error) => {

                                })
                        },
                        onError:  (jqxhr, textstatus, error) => {
                            this.page.snackbar.showError(jqxhr, textstatus)
                        }
                    })
                },
                onDelete: (data: {id: number}) =>{
                    let postingId = data.id.toString();
                    //push changes to server
                    this.deletePosting(postingId)
                }
            }
        });
        this.page.sidebar.show();
    }

    deletePosting(postingId: string){
        eventBlueprintActions.removePosting(this.event.id, postingId, {
            onSuccess: ()=>{
                this.refreshEvent()
                    .then((event: IEventBlueprint) => {
                        this._resetDisplayList()
                        this.reloadCurrentView()
                        this.searchbar.hide();
                        this.page.sidebar.showDefault();
                        this.page.snackbar.show("Posten erfolgreich gespeichert.")
                    })
            }
        }).fail((jqxhr, textstatus, error) => {
            this.page.snackbar.showError(jqxhr, textstatus)
        });
    }

    _setDisplayList(list: IBlueprintPosting[]){
        this.displayList = list;
    }

    _resetDisplayList(){
        this.displayList = this.dataList;
    }

    async refreshEvent(): Promise<IEventBlueprint> {
        try {
            const event = await this.eventProfile.refreshEvent()
            this.event = event;
            this.dataList = event.postings;
            return event;
        }
        catch(e) {
            console.error(e);
            throw e;
        }
    }

    _applyTimeFromDateString(dateString: Date|number|string): Date {
        let date = new Date(dateString);
        let fixedDate = new Date();
        fixedDate.setHours(date.getHours(), date.getMinutes());
        return fixedDate;
    }

    /**
     * ensures that two digits are used and returns a string
     * @param {number} timeInt Integer representing days, months, hours, minutes, etc.
     */
    _normalizeTime(timeInt: number|string){
        if(parseInt(timeInt.toString()) < 0) return "00";
        if(parseInt(timeInt.toString()) > 24) return "24";
        if(timeInt.toString().length === 1) return `0${timeInt}`;
        if(timeInt.toString().length > 2) return timeInt.toString().slice(0,2)
        return timeInt.toString();
    }

    _getCalendarEvents() {
        let calendarEvents = this.event.postings.map((posting) =>{
            const startDateToday = this._applyTimeFromDateString(posting.date.startTime)
            const endDateToday = this._applyTimeFromDateString(posting.date.endTime)

            return {
                id: posting._id.toString(),
                title: posting.description,
                groupId: posting.requiredQualifications[0]._id.toString(),
                // description: event.dateRangeString + "\n " + event.type.value,
                typeIndex: posting.requiredQualifications[0]._id,
                start: startDateToday,
                end: endDateToday,
                resourceId: posting.requiredQualifications[0]._id.toString(),
            }
        })
        return calendarEvents

    }

    _getCalendarResources() {
        let resources = this.event.postings.map((posting)=> {
            return {
                id: posting.requiredQualifications[0]._id.toString(),
                title: posting.requiredQualifications[0].short
            }
        })
        return resources;
    }

    reloadCurrentView() {
        switch (this.currentView) {
            case "cards":
                this.showCards();
                break;
            case "calendar":
                this.showCalendar();
                break;
            case "resources":
                this.showResources();
                break;
        }
    }
}
