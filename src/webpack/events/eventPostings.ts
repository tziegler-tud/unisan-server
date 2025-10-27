import { UserProfile } from "../userprofile/userprofile";
import { DropdownMenu } from "../helpers/dropdownMenu";
import Snackbar from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import PageModule from "../utils/PageModule";
import Sidebar from "../sidebar/Sidebar";
import ComponentPage, { ComponentPageOptions } from "../components/ComponentPage";

import {Dialog as lidlDialog} from "../../lib/lidl-modules/dialog/lidl-dialog.js";

import aclActions, {UserDockerACL} from "../actions/aclActions";
import EventProfile from "./EventProfile";

import {phone, tablet} from "../helpers/variables";
import eventFactoryPlugin, {
        AddPostingOnConfirmPayload
} from "../sidebar/plugins/plugin-eventfactory";
import {IEvent} from "../types/Event";
import {eventPlugin} from "../sidebar/plugins/plugin-event";
import eventActions from "../actions/eventActions";
import eventBlueprintActions from "../actions/eventBlueprintActions";
import type {IEventBlueprint} from "../types/EventBlueprint";
import {qualTypesMap} from "../types/Qualification";
import EditableInputField from "../helpers/EditableInputField";
import EventPostingsComponent from "../components/pageComponents/events/EventPostingsComponent";
import Component from "../components/Component";

interface PageData {
    user?: any; // Replace 'any' with the actual type of user data
    targetUser?: any;
    event?: IEvent
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
    title: "events.postings",
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
        this.snackbar = new Snackbar();

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

        // get user data from user service
        //subscribe as observer to get notification if user changes on server
        const currentUser = await currentUserProfile.getUserAndSubscribe(ob1);

        let eventProfile = new EventProfile(exploreEventId);

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

        args.allowEdit = false;

        let self = this;

        const user = data.user;
        let event = data.event;
        const sidebar = new Sidebar("wrapper");
        sidebar.addPlugin(eventPlugin);

        let dockerACL: UserDockerACL = undefined;
        try {
            dockerACL = await aclActions.getCurrentUserDockerAcl();
            args.allowEdit = dockerACL.events.write;
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


        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

        let titleInputContainer = document.getElementById("eventtitle-input");
        let editableInputField = new EditableInputField(titleInputContainer, event.title.delta, "text", {}, {readOnly: true});

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
                    eventActions.deleteEvent(event.id.toString())
                }
            }
        };

        var token = lidlRTO.objectManager.createNewObjectToken();
        // @ts-ignore
        const dialogDeleteEvent = new lidlDialog(token, ".eventDelete", 'confirmDelete', deleteContent, deleteArgs);
        lidlRTO.objectManager.addObject(dialogDeleteEvent, token);


        let pageContainer = document.getElementById("componentPage-component-container");
        var componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: sidebar,
            data: data,
            args: {},
        });

        componentPage.addSection({
            identifier: "POSTINGS",
            order: 1,
            title: "Dienstposten",
            displayMode: "hidden",
            disableMargins: false,
            disableComponentMargins: true,
            styling: {
                backgroundColor: 'transparent',
            }
        })
        const eventPostingsComponent = await componentPage.addComponent({
            identifier: "eventPostingsComponent",
            componentType: ComponentPage.componentTypes.EVENTS.POSTINGS,
            section:"POSTINGS",
            componentArgs: {allowEdit: args.allowEdit, size: "full", acl: dockerACL},
            data: {user: data.user, event: event}
        })

        let qualTypes = [qualTypesMap.SAN, qualTypesMap.FUEHRUNG];

        document.querySelectorAll('.add-participant-button').forEach((element) => {
            element.addEventListener('click', async (e) => {
                e.preventDefault();
                await eventPostingsComponent.triggerEvent('addPosting');
                // sidebar.addContent("addEventPosting", {
                //     event: self.pageData.event,
                //     user: this.user,
                //     isParticipant: this.userIsParticipant,
                //     qualTypes: qualTypes,
                //     callback: {
                //         onConfirm: (data: AddPostingOnConfirmPayload, args: {})=> {
                //             let posting = {
                //                 requiredQualifications: data.qualifications,
                //                 description: data.description,
                //                 allowHigher: data.allowHigher,
                //                 optional: data.optional,
                //                 enabled: data.enabled,
                //                 startTime: data.startTime,
                //                 endTime: data.endTime,
                //                 date: event.date.startDate,
                //             }
                //             eventActions.addPosting(event.id.toString(), posting, (event)=> {
                //                 this.pageData.eventProfile.refreshEvent()
                //                     .then((event: IEvent) => {
                //                         self.pageData.event = event;
                //                         this.userIsParticipant = this.pageData.eventProfile.checkIfUserIsRegistered(user);
                //                         sidebar.update({event: event, isParticipant: this.userIsParticipant});
                //                         componentPage.reload();
                //                     })
                //                     .catch((err: Error) => {
                //
                //                     })
                //             }, {})
                //                 .fail((jqxhr, textstatus, error) => this.snackbar.showError(jqxhr, textstatus, error));
                //         },
                //     },
                // });
                // sidebar.show();
            })
        });

        // init event sidebar
        //find if current user is already registered
        await sidebar.addContent("eventPostings", {
            event: event,
            user: user,
            isParticipant: false,
            callback: {},
        });

        if(phone.matches || tablet.matches) {
            sidebar.hide();
        }
        else {
            sidebar.show();
        }


    },
} as PageModuleArgs);