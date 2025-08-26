import Component from "../../Component";
import ComponentPage from "../../ComponentPage";
import Searchbar from "../../../widgets/searchbar/SearchBar";
import {DropdownMenu} from "../../../helpers/dropdownMenu";
import {Corner} from "@material/menu";
import {
    AddPositionOnConfirmPayload,
    AddPositionOnDeletePayload,
    eventPlugin,
    ShowPostingConfirmPayload
} from "../../../sidebar/plugins/plugin-event";
import DisplaySelector, {DisplaySelectorEventData} from "../../../widgets/DisplaySelector/DisplaySelector";
import {Calendar} from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

import {IEvent, IPosition, IPosting} from "../../../types/Event";
import {IQualification, qualTypesMap} from "../../../types/Qualification";
import EventProfile from "../../../events/EventProfile";
import eventActions from "../../../actions/eventActions";
import {IUser} from "../../../types/User";

import {getTemplate} from "../../../utils/utils";

import Handlebars from "handlebars";

import "../../scss/events/EventPostingsComponent.scss"
import {MDCRipple} from "@material/ripple";
import {AddPostingOnConfirmPayload} from "../../../sidebar/plugins/plugin-eventfactory";
import EventPostingsList, {
    EventPostingsListArgs, EventPostingsListCallback,
    EventPostingsListItemCallback,
    PositionGroup
} from "../../../scrollableList/EventPostingsList";


interface ComponentArgs {
    page: ComponentPage;
    section: any;
    componentId: string;
    pageData?: any;
    data?: {
        user: any;
        event: IEvent
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

export default class EventPostingsComponent extends Component {
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

        this.eventProfile = new EventProfile(this.event.id);
    }

    private event: IEvent;

    private viewConfig!: { sort: string; order: string };
    private eventData!: {
        list: IEvent[];
    };
    private listContainer: HTMLElement | null;
    private calendarContainer: HTMLElement | null;
    private searchbar!: Searchbar;
    private dataList: IPosting[] = [];
    private displayList?: IPosting[] = null;
    private eventProfile: EventProfile;
    private allowEdit: boolean;
    private calendar: Calendar;
    private cardsList: EventPostingsList;

    private calendarEventStartTimeString: string;
    private calendarEventEndTimeString: string;

    private currentView: "cards" | "calendar" | "resources";

    private userDisplayTemplate: HandlebarsTemplateDelegate<any>;
    private userDisplayTemplateShort: HandlebarsTemplateDelegate<any>;
    private unassignedTemplate: HandlebarsTemplateDelegate<any>;


    async postRender(): Promise<void> {
        this.viewConfig = { sort: "date.startDate", order: "desc" };
        this.cardsList = null;
        this.listContainer = document.getElementById('eventPostingsComponent--list');
        this.calendarContainer = document.getElementById('eventPostingsComponent--calendar');


        const userDisplayTemplateData = await getTemplate("/webpack/components/templates/atoms/userDisplay.hbs")
        const userDisplayTemplateShortData = await getTemplate("/webpack/components/templates/atoms/userDisplayShort.hbs")
        this.userDisplayTemplate = Handlebars.compile(userDisplayTemplateData)
        this.userDisplayTemplateShort = Handlebars.compile(userDisplayTemplateShortData)

        const unassignedTemplateData = await getTemplate("/webpack/components/templates/atoms/userDisplayUnassigned.hbs")
        this.unassignedTemplate = Handlebars.compile(unassignedTemplateData)

        await this.refreshEvent();

        const eventStartDate = new Date(this.event.date.startDate)
        const eventEndDate = new Date(this.event.date.endDate)

        this.calendarEventStartTimeString = `${this._normalizeTime(eventStartDate.getHours()-1)}:${this._normalizeTime(eventStartDate.getMinutes())}:00`
        this.calendarEventEndTimeString = `${this._normalizeTime(eventEndDate.getHours()+1)}:${this._normalizeTime(eventEndDate.getMinutes())}:00`

        this.page.sidebar.addPlugin(eventPlugin);

        const buttonRipple = new MDCRipple(document.querySelector('.mdc-button'));

        const addPositionButton = document.getElementById("eventPostingsComponent--addPositionButton");
        const addPostingButton = document.getElementById("eventPostingsComponent--addPostingButton");


        if(addPositionButton){
            addPositionButton.addEventListener("click", (e)=>{
                e.preventDefault();
                e.stopPropagation();
                this.showAddPositionSidebar()
            })
        }

        if(addPostingButton){
            addPostingButton.addEventListener("click", (e)=>{
                e.preventDefault();
                e.stopPropagation();
                this.showAddPostingSidebar();
            })
        }

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

    _filterPostingsList(postingsList: IPosting[], inputValue: string): IPosting[] {
        return postingsList.filter((posting)=>{
            const qualMatches = posting.requiredQualifications.some((qual: IQualification) => {
                return qual.name.includes(inputValue) || qual.short.includes(inputValue)
            })
            let nameMatches = false;
            if(posting.assigned.isAssigned && posting.assigned.user) {
                nameMatches = posting.assigned.user.generalData?.firstName.value.includes(inputValue) || posting.assigned.user.generalData?.lastName.value.includes(inputValue)
            }
            return qualMatches || nameMatches
        })
    }

    _sortDataList(dataList: IPosting[], orderArray?: string[]): IPosting[] {
        const defaultOrderArray = [qualTypesMap.FUEHRUNG, qualTypesMap.SAN, qualTypesMap.AUSBILDUNG, qualTypesMap.NACHWEIS]
        if(orderArray === undefined) orderArray = defaultOrderArray;

        //assign index values to array elements
        const typeIndexMap: {[key: string]: number} = {}
        orderArray.forEach((qualType, index)=>{
            typeIndexMap[qualType] = index;
        })

        return dataList.sort((a: IPosting, b: IPosting): number => {
            //typeIndex first
            const qualA = a.requiredQualifications[0];
            const qualB = b.requiredQualifications[0];

            if(!(qualA && qualB)) return 0; //no qual found, abort

            const typeIndexA = typeIndexMap[qualA.qualType];
            const typeIndexB = typeIndexMap[qualB.qualType];
            if(typeIndexA === undefined || typeIndexB === undefined) return 0;
            if(typeIndexA < typeIndexB) return -1;
            if(typeIndexA > typeIndexB) return 1;
            //compare qual level within same type
            if(typeIndexA === typeIndexB) {
                return qualB.level - qualA.level;
            }
        })

    }

    getHtml(): string {
        return this.html;
    }

    showCalendar(){

        this.currentView = "calendar";
        this.listContainer.innerHTML = "";

        const dataList = this._sortDataList(this.displayList);


        const calendarEvents = this._getCalendarEvents(dataList, (posting)=> posting.requiredQualifications[0]._id.toString());
        const resources = this._getQualificationsAsResources(dataList);

        if (this.calendarContainer) {
            this.calendar = new Calendar(this.calendarContainer, {
                customButtons: {
                    dienstplanButton: {
                        text: 'Dienstplan',
                    }
                },
                schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
                plugins: [interactionPlugin, resourceTimelinePlugin],
                initialView: 'resourceTimeline',
                expandRows: true,
                height: "auto",
                resourceAreaWidth: 300,
                resources: resources,
                resourceOrder: 'order',
                slotMinTime: this.calendarEventStartTimeString,
                slotMaxTime: this.calendarEventEndTimeString,
                //aspectRatio: 6,
                headerToolbar: {
                    left: '',
                    center: 'title',
                    right: 'prev,next',
                },
                // selectable: true,
                events: calendarEvents,

                eventClick: (info) => {
                    if(info.event.display === "background") return;
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
                },
                eventContent: (arg) => {
                    if(arg.event.display === "background") return;
                    const postingId = arg.event.id;
                    if(!postingId) {
                        this.page.snackbar.showCustomError("Ein Fehler ist aufgetreten.", "Error")
                    }
                    const posting = this.getPosting(postingId);
                    const htmlContent = this.createTitleFromPosting(posting)
                    return {domNodes: [htmlContent]}
                },
                resourceAreaHeaderContent: "Qualifikation",

            });
            const eventTimeBackgroundEvent = this._getBackgroundEvent(); //background events are used to display the event time
            this.calendar.addEvent(eventTimeBackgroundEvent)
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

        const dataList = this._sortDataList(this.displayList);


        const calendarEvents = this._getCalendarEvents(dataList, (posting)=> posting.position ? posting.position.toString() : "0");
        const resources = this._getGroupsAsResources(dataList);

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
                height: "auto",
                resources: resources,
                resourceOrder: 'order',

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
                eventClassNames: ["calendarEvent-timeGrid"],
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
                },
                eventContent: (arg) => {
                    const postingId = arg.event.id;
                    if(!postingId) {
                        this.page.snackbar.showCustomError("Ein Fehler ist aufgetreten.", "Error")
                    }
                    const posting = this.getPosting(postingId);
                    const htmlContent = this.createTitleFromPosting(posting, true)
                    return {domNodes: [htmlContent]}
                },
                resourceAreaHeaderContent: "Qualifikation"
            });
            //add background event
            const eventTimeBackgroundEvent = this._getBackgroundEvent(); //background events are used to display the event time
            // this.calendar.addEvent(eventTimeBackgroundEvent)
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
        sortedList = this._sortDataList(sortedList);

        const groupedList = this._groupByPosition(sortedList);
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


        let scrollArgs: EventPostingsListArgs = {
            enableMobile: true,
            allowEdit: this.allowEdit,
        }
        const eventId = this.event.id.toString();

        const self = this;

        let callback: EventPostingsListCallback = {
            listItem: {
                onClick:  (e: Event)=> {
                    const element = e.currentTarget as HTMLElement;
                    e.preventDefault();
                    //@ts-ignore
                    const postingId = element.dataset.postingid;
                    const isAllowed = element.dataset.userisallowed === "true";
                    self.showDetailsSidebar(postingId, isAllowed)
                },
                dropOnPosition(postingId: string, positionId: string){
                    if(!self.allowEdit) return;
                    const posting = self.event.postings.find(posting => posting._id.toString() === postingId);
                    const currentPosition = posting.position
                    if(currentPosition === positionId || (!currentPosition && positionId == "0")) return;
                    eventActions.assignPostingToPosition(eventId, postingId, positionId)
                        .then(()=>{
                            self.refreshEvent()
                                .then((event: IEvent) => {
                                    self._resetDisplayList()
                                    self.reloadCurrentView()
                                    self.page.snackbar.show("Posten erfolgreich zugewiesen.")
                                })
                                .catch((err: Error) => {})
                        })
                        .catch(err => {
                            self.page.snackbar.showCustomError(err.message, "Error", err)
                        })
                }
            },
            listHeader: {
                onClick:(e: Event) => {
                    if(!self.allowEdit) return;
                    const element = e.currentTarget as HTMLElement;
                    e.preventDefault();
                    const positionId = element.dataset.positionid
                    if(positionId === "0") return;
                    const position = this.event.positions.find(position => position._id.toString() === positionId)
                    if(!position) {
                        return;
                    }
                    self.showEditPositionSidebar(position)
                }
            },
            customHandlers: [deletePost, dropdownMenus, postDetails]
        }

        this.cardsList = new EventPostingsList(this.listContainer, groupedList, scrollArgs, callback)
        this.cardsList.render();
        return this.cardsList;
    }

    showEditPositionSidebar(position: IPosition) {
        this.page.sidebar.addContent("eventPosition", {
            event: this.event,
            position: position,
            callback: {
                onConfirm: (data: AddPositionOnConfirmPayload, args: {})=> {
                    let updatedPos = {
                        _id: position._id,
                        title: data.title,
                        description: data.description,
                    }
                    eventActions.updatePosition(this.event.id.toString(), updatedPos, {
                        onSuccess: () => {
                            this.refreshEvent()
                                .then((event: IEvent) => {
                                    this._resetDisplayList()
                                    this.reloadCurrentView()
                                    this.page.snackbar.show("Position erfolgreich gespeichert.")
                                })
                                .catch(err => {
                                    this.page.snackbar.showCustomError(err.message, "Error")
                                })
                            this.page.sidebar.hide();
                        },
                        onError: (jqXHR: JQuery.jqXHR, textStatus: string, errorThrown: string) => {
                            this.page.snackbar.showError(jqXHR, textStatus)
                        }
                    })
                },
                onDelete: (data: AddPositionOnDeletePayload)=> {
                    eventActions.removePosition(this.event.id.toString(), position._id.toString(), {
                        onSuccess: () => {
                            this.refreshEvent()
                                .then((event: IEvent) => {
                                    this._resetDisplayList()
                                    this.reloadCurrentView()
                                    this.page.snackbar.show("Position erfolgreich gelöscht.")
                                })
                                .catch(err => {
                                    this.page.snackbar.showCustomError(err.message, "Error")
                                })
                            this.page.sidebar.hide();

                        },
                        onError: (jqXHR: JQuery.jqXHR, textStatus: string, errorThrown: string) => {
                            this.page.snackbar.showError(jqXHR, textStatus)
                        }
                    })

                }
            }
        })
        this.page.sidebar.show();
    }
    showAddPositionSidebar(position? : IPosition){
        this.page.sidebar.addContent("eventPosition", {
            event: this.event,
            position: null,
            callback: {
                onConfirm: (data: AddPositionOnConfirmPayload, args: {})=> {
                    let position = {
                        title: data.title,
                        description: data.description,
                    }
                    eventActions.addPosition(this.event.id.toString(), position, {
                        onSuccess: () => {
                            this.refreshEvent()
                                .then((event: IEvent) => {
                                    this._resetDisplayList()
                                    this.reloadCurrentView()
                                    this.page.snackbar.show("Position erfolgreich gespeichert.")
                                })
                                .catch(err => {
                                    this.page.snackbar.showCustomError(err.message, "Error")
                                })
                            this.page.sidebar.hide();

                        },
                        onError: (jqXHR: JQuery.jqXHR, textStatus: string, errorThrown: string) => {
                            this.page.snackbar.showError(jqXHR, textStatus)
                        }
                    })
                }
            }
        })
        this.page.sidebar.show();
    }

    showAddPostingSidebar(){
        let qualTypes = [qualTypesMap.SAN, qualTypesMap.FUEHRUNG, qualTypesMap.AUSBILDUNG, qualTypesMap.NACHWEIS];

        this.page.sidebar.addContent("addEventPosting", {
            event: this.event,
            allowEdit: this.allowEdit,
            user: this.user,
            qualTypes: qualTypes,
            callback: {
                onConfirm: (data: AddPostingOnConfirmPayload, args: {})=> {
                    let posting = {
                        requiredQualifications: data.qualifications,
                        description: data.description,
                        allowHigher: data.allowHigher,
                        optional: data.optional,
                        enabled: data.enabled,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        date: this.event.date.startDate,
                    }
                    eventActions.addPosting(this.event.id.toString(), posting, (event) => {
                            this.refreshEvent()
                                .then((event: IEvent) => {
                                    this._resetDisplayList()
                                    this.reloadCurrentView()
                                    this.page.snackbar.show("Posten erfolgreich gespeichert.")
                                })
                                .catch(err => {
                                    this.page.snackbar.showCustomError(err.message, "Error")
                                })

                    }, {})
                    .fail((jqxhr, textstatus, error) => {
                        this.page.snackbar.showError(jqxhr, textstatus)
                    });
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

    showDetailsSidebar = (postingId: string, isAllowed: boolean) => {
        let augmentedPosting = this.dataList.find(e => e._id.toString() === postingId);

        this.page.sidebar.addContent("showPostingDetails", {
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
                        startTime: data.startTime,
                        endTime: data.endTime,
                        date: this.event.date.startDate,
                    }
                    eventActions.updatePosting(this.event.id.toString(), posting, {
                        onSuccess: ()=>{
                            this.refreshEvent()
                                .then((event: IEvent) => {
                                    this._resetDisplayList()
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
                onAssign: (data: {event: IEvent, postingId: string, userId: string}) => {
                    let event = data.event;
                    let postingId = data.postingId;
                    let userId = data.userId;
                    this._assignUser(event, postingId, userId);
                },
                onUnassign: (data: {event: IEvent, postingId: string, userId: string}) => {
                    let event = data.event;
                    let postingId = data.postingId;
                    let userId = data.userId;
                    this._unassignUser(event, postingId, userId);
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

    _assignUser(event: IEvent, postingId: string, userId: string){
        eventActions.assignPost(event.id.toString(), postingId, userId, ()=>{
            this.refreshEvent()
                .then((event: IEvent) => {
                    this._resetDisplayList()
                    this.reloadCurrentView()
                    this.showDetailsSidebar(postingId, true);
                })
        }).fail((jqxhr, textstatus, error) => {
            this.page.snackbar.showError(jqxhr, textstatus)
        });
    }
    _unassignUser(event: IEvent, postingId: string, userId: string){
        eventActions.unassignPost(event.id.toString(), postingId, userId, ()=>{
            this.refreshEvent()
                .then((event: IEvent) => {
                    this._resetDisplayList()
                    this.reloadCurrentView()
                    this.showDetailsSidebar(postingId, true);
                })
        }).fail((jqxhr, textstatus, error) => {
            this.page.snackbar.showError(jqxhr, textstatus)
        });
    }
    deletePosting(postingId: string){
        eventActions.removePosting(this.event.id, postingId, {
            onSuccess: ()=>{
                this.refreshEvent()
                    .then((event: IEvent) => {
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

    getPosting(postingId: string): IPosting {
        return this.event.postings.find(e => e._id.toString() === postingId);
    }

    _setDisplayList(list: IPosting[]){
        this.displayList = list;
    }

    _resetDisplayList(){
        this.displayList = this.dataList;
    }

    async refreshEvent(): Promise<IEvent> {
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

    _getCalendarEvents(dataList: IPosting[], resourceFunc: (posting: IPosting) => string) {

        let calendarEvents = dataList.map((posting) =>{
            const startDateToday = this._applyTimeFromDateString(posting.date.startDate)
            const endDateToday = this._applyTimeFromDateString(posting.date.endDate)

            const description =  this.createTitleFromPosting(posting)
            const isAssigned = posting.assigned.isAssigned;
            const optional = posting.optional;

            return {
                id: posting._id.toString(),
                title: posting.description,
                groupId: posting.requiredQualifications[0]._id.toString(),
                // description: { domNodes: [description] },
                typeIndex: posting.requiredQualifications[0]._id,
                classNames: ["calendarEvent", "calendarEvent--posting", (optional? "calendarEvent--optional" : ""), (!isAssigned ? "calendarEvent--unassigned" : "")],
                start: startDateToday,
                end: endDateToday,
                resourceId: resourceFunc(posting),
            }
        })
        return calendarEvents

    }

    _getQualificationsAsResources(dataList: IPosting[]) {
        let resources = dataList.map((posting, index)=> {
            return {
                id: posting.requiredQualifications[0]._id.toString(),
                title: posting.requiredQualifications[0].short,
                order: index,
            }
        })
        return resources;
    }

    _getGroupsAsResources(dataList: IPosting[]) {
        const groups = this._groupByPosition(dataList);
        return groups.map((group, index) => {
            return {
                id: group.id.toString(),
                title: group.title,
                order: index
            }
        })
    }

    _getBackgroundEvent(){
        const resources = this.calendar.getResources();
        const resourceIds = resources.map(resource => resource.id);
        const startDate = this._applyTimeFromDateString(this.event.date.startDate)
        const endDate = this._applyTimeFromDateString(this.event.date.endDate)
        const event = {
            start: startDate,
            end: endDate,
            display: 'background',
            resourceIds: resourceIds,
            classNames: ["eventTimeBackgroundEvent"]
        }
        return event;
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

    _groupByPosition(list: IPosting[]) {

        const groups: PositionGroup[] = [];
        const defaultPosition: PositionGroup = {
            id: 0,
            title: "Andere",
            description: "",
            postings:  [],
            total: 0,
            assigned: 0,
        };
        this.event.positions.forEach(position => {
            groups.push({
                id: position._id,
                title: position.title,
                description: position.description,
                postings: [],
                total: 0,
                assigned: 0,
            })
        })
        list.forEach(posting => {
            const pos = posting.position
            if(pos) {
                //find position
                const position = groups.find(p => p.id.toString() === pos.toString())
                if(position) {
                    position.postings.push(posting)
                    position.total = position.postings.length;
                    position.assigned = posting.assigned.isAssigned ? position.assigned + 1 : position.assigned;
                }
            }
            else {
                defaultPosition.postings.push(posting)
                defaultPosition.total = defaultPosition.postings.length;
                defaultPosition.assigned = posting.assigned.isAssigned ? defaultPosition.assigned + 1 : defaultPosition.assigned;
            }
        })
        return [defaultPosition, ...groups]
    }

    createTitleFromPosting(posting: IPosting, useShortForm: boolean = false) {
        const container = document.createElement("div");
        container.classList.add("calendarEvent--descriptionContainer");
        let user: IUser;

        if(posting.assigned.isAssigned){
            user = posting.assigned.user;
            let context = {
                user: user,
                text: "test"
            }

            let html = ""
            if(useShortForm) {
                html = this.userDisplayTemplateShort(context)
            }
            else {
                html = this.userDisplayTemplate(context);
            }
            container.innerHTML = html;
        }

        else {
            const context = {
                title: posting.requiredQualifications[0].short,
                text: posting.description
            }
            const html = this.unassignedTemplate(context)
            container.innerHTML = html;
        }


        return container;
    }

    async reload(){
        this.reloadCurrentView();
    }
}


