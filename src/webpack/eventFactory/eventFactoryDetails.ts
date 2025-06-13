import { UserProfile } from "../userprofile/userprofile";
import { DropdownMenu } from "../helpers/dropdownMenu";
import { dateFromNow } from "../helpers/helpers";
import Snackbar from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import PageModule from "../utils/PageModule";
import Sidebar from "../sidebar/Sidebar";
import { userPlugin } from "../sidebar/plugins/plugin-user";
import ComponentPage, { ComponentPageOptions } from "../components/ComponentPage";

import {Observer as lidlObserver} from "../../lib/lidl-modules/observer/lidl-observer.js";
import {Dialog as lidlDialog} from "../../lib/lidl-modules/dialog/lidl-dialog.js";

import {eventPlugin} from "../sidebar/plugins/plugin-event";
import pluginCalendar from "../sidebar/plugins/plugin-calendar";
import aclActions from "../actions/aclActions";
import EventBlueprintProfile from "./EventBlueprintProfile";

import {type IEventBlueprint} from "../types/EventBlueprint"
import eventBlueprintActions from "../actions/eventBlueprintActions";
import EditableInputField from "../helpers/EditableInputField";
import {phone, tablet} from "../helpers/variables";
import {EventPage} from "./eventPage";

interface PageData {
    user?: any; // Replace 'any' with the actual type of user data
    targetUser?: any;
    event?: IEventBlueprint
}

interface InitArgs {
    // Define any arguments expected by the init function
}

interface BuildPageArgs {
    args?: any; // Replace 'any' with the specific type if known
    data?: PageData;
}

interface PageModuleArgs {
    title: string;
    pageData: PageData;
    init: (args: InitArgs) => Promise<{ args: InitArgs; data: PageData }>;
    buildPage: (buildPageArgs?: BuildPageArgs) => Promise<void>;
}

interface LidlObserver {
    (user: any): void; // Replace 'any' with the actual type of user data
}

export default new PageModule({
    title: "eventFactory.details",
    pageData: {},
    init: async function (args: InitArgs): Promise<{ args: InitArgs; data: PageData }> {
        // @ts-ignore
        const currentUserProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);
        // @ts-ignore
        const exploreEventId = (window.exploreEventId !== undefined) ? window.exploreEventId : "";

        // create new observer
        const ob1: LidlObserver = (u) => {
            this.pageData.user = u;
        };
        // @ts-ignore
        window.snackbar = new Snackbar();

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

        // get user data from user service
        //subscribe as observer to get notification if user changes on server
        const currentUser = await currentUserProfile.getUserAndSubscribe(ob1);

        let eventProfile = new EventBlueprintProfile(exploreEventId);

        let event = await eventProfile.getEvent()
        this.pageData.eventProfile = eventProfile;
        this.pageData.event = event;

        const data: PageData = {
            user: currentUser,
            event: event,
        };
        return { args, data };
    },
    buildPage: async function ({ args = {}, data = {} }: BuildPageArgs = {}): Promise<void> {

        args.allowEdit = true;

        let self = this;

        const user = data.user;
        let event = data.event;
        const sidebar = new Sidebar("wrapper");
        sidebar.addPlugin(eventPlugin);

        let dockerACL = undefined;
        let allowCreateEvent = false;
        try {
            dockerACL = await aclActions.getCurrentUserDockerAcl();
            allowCreateEvent = dockerACL.events.create;
        }
        catch(e) {
            console.error("Failed to get user acl. This might lead to incorrect display")
        }

        //@ts-ignore
        if(window.DockerElement !== undefined) {
            //@ts-ignore
            this.pageData.eventSubpageId = window.DockerElement.addDockerSubPage("event", event, {}, undefined, {currentEvent: {edit: args.allowEdit}});
        }

        //@ts-ignore
        var lidlRTO = window.lidlRTO;

        let pageContainer = document.getElementById("eventPage-component-container");
        var eventPage = new EventPage({
            container: pageContainer,
            sidebar: sidebar,
            data: {user: user, event: event},
            args: {},
        });
        //@ts-ignore
        window.eventPage = eventPage;


        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

        const deleteContent = {
            title: "Event-Vorlage löschen",
            message: "Dieser Vorgang kann nicht rückgängig gemacht werden. Fortfahren?",
            titleArg: "",
            messageArg: ""
        };

        var deleteArgs = {
            eventid: event.id,
            callback: {
                onConfirm: function () {
                    eventBlueprintActions.deleteEventBlueprint(event.id)
                }
            }
        };

        var token = lidlRTO.objectManager.createNewObjectToken();
        // @ts-ignore
        const dialogDeleteEvent = new lidlDialog(token, ".eventDelete", 'confirmDelete', deleteContent, deleteArgs);
        lidlRTO.objectManager.addObject(dialogDeleteEvent, token);

        let cb = {
            onConfirm: (editableInputField: EditableInputField)=> {
                let data = {
                    delta: editableInputField.getQuill().getContents(),
                    value: editableInputField.getQuill().getText(),
                }
                eventBlueprintActions.saveTitle(event.id, data, {
                    onSuccess: (result) =>{
                        editableInputField = editableInputField.reset(titleInputContainer, result.title.delta, "text", cb, {})
                        //update docker nav
                        this.pageData.eventProfile.refreshEvent()
                            .then((ev: IEventBlueprint) => {
                                event = ev;
                                //@ts-ignore
                                window.DockerElement.subpageHandler.update(self.pageData.eventSubpageId, "event", event)
                            })
                            .catch((err: Error) =>{
                                throw err
                            });
                    }
                })
            }
        };
        let titleInputContainer = document.getElementById("eventtitle-input");
        let editableInputField = new EditableInputField(titleInputContainer, event.title.delta, "text", cb, {limit: 40});

        let eventDate = function(){
            $("#eventDateEditor").on("click", function(){
                sidebar.addContent("editEventDate", {
                    event: event,
                    callback: {
                        onConfirm: function(eventid:number, data: {startTime: string, endTime: string}){
                            eventBlueprintActions.updateTime(event.id, {startTime: data.startTime, endTime: data.endTime }, {
                                onSuccess: function(){
                                    window.location.reload();
                                },
                                onError: function(jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) {
                                    sidebar.addErrorMessage("Failed to save entry to database: " + errorThrown, null, true, false)
                                }
                            });
                        },
                    },
                });
                sidebar.show();
            })
        }

        let eventLocation = function() {
            $("#eventLocationEditor").on("click", function(){
                sidebar.addContent("editEventLocation", {
                    event: event,
                    callback: {
                        onConfirm: function(eventid: number, data: {location: string}){
                            eventBlueprintActions.saveLocation(event.id, {value: data.location}, {
                                onSuccess: function(){
                                    window.location.reload();
                                },
                                onError: function(jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string ) {
                                    sidebar.addErrorMessage("Failed to save entry to database: " + errorThrown, null, true, false)
                                }
                            });
                        },
                    },
                });
                sidebar.show();
            })
        }

        //get event type
        switch(event.type.index){
            case 1:
                buildTrainingPage();
                break;
            case 2:
                buildSeminarPage();
                break;
            case 3:
                buildSanPage();
                break;
            case undefined:
            default:
        }

        if(phone.matches || tablet.matches) {
            sidebar.hide();
        }
        else {
            sidebar.show();
        }

        function buildTrainingPage(){
            eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: true, size: "full"});
            eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: true, size: "half", handlers: [eventDate, eventLocation]});
        }

        function buildSeminarPage(){
            eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: true, size: "full"});
            eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: true, size: "half", handlers: [eventDate, eventLocation]});

            // init event sidebar
            //find if current user is already registered
            sidebar.addContent("eventPostings", {
                event: event,
                user: user,
                isParticipant: false,
                callback: {},
            });
        }

        function buildSanPage(){
            eventPage.addComponent(EventPage.componentTypes.DESCRIPTION, {allowEdit: true, size: "full"});
            eventPage.addComponent(EventPage.componentTypes.DATE, {allowEdit: true, size: "half", handlers: [eventDate, eventLocation]});

            // init event sidebar
            //find if current user is already registered
            sidebar.addContent("eventPostings", {
                event: event,
                user: user,
                isParticipant: false,
                callback: {
                },
            });
        }
    },
} as PageModuleArgs);