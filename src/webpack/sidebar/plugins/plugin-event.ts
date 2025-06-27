import "../sidebar-events.scss";
import "../sidebar-addParticipant.scss";

import {type IEvent, IPosition, IPosting} from "../../types/Event"
import {type IQualification} from "../../types/Qualification";

import Sidebar from "../Sidebar";
import SidebarPlugin from "../SidebarPlugin"
import ContentHandler from "../ContentHandler";
import SidebarButton from "../SidebarButton";
import SidebarTooltip from "../SidebarTooltip";

import Searchbar from "../../widgets/searchbar/SearchBar";

import Handlebars from "handlebars";
import "../../helpers/handlebarsHelpers";
import {getMatchingQualifications} from "../../helpers/helpers";
import EditableInputField from "../../helpers/EditableInputField";
import {EditableTextField} from "../../helpers/editableTextField";

import HandlerFunctionResult from "../HandlerFunctionResult";
import HandlerFunctionError from "../HandlerFunctionError";
import {fetchData, getTemplate} from "../../utils/utils";
import qualificationActions from "../../actions/qualificationActions";

import {MDCChipSet} from '@material/chips';



export interface AddPostingOnConfirmPayload {
    qualifications: number[],
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    startTime: string,
    endTime: string,
}

export interface AddPostingOnConfirmArgs {
    startTime: string
    endTime: string
}

export interface AddPositionOnConfirmPayload {
    title: string,
    description: string,
}


export interface ShowPostingConfirmPayload {
    id: string|number,
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
    date: Date,
    startTime: string,
    endTime: string,
    qualifications: number[],
}

interface UserData {
    id: number;
    generalData?: {
        lastName?: { value: string };
    };
    // Add other user properties as needed
}


/**
 * Defines the structure for arguments passed to ContentHandler functions.
 */
interface SidebarArgs {
    event: IEvent;
    isParticipant?: boolean;
    callback?: {
        onConfirm?: (...args: any[]) => void;
        onDelete?: (...args: any[]) => void;
        onCancel?: (...args: any[]) => void;
        onAssign?: (...args: any[]) => void;
        onUnassign?: (...args: any[]) => void;
    };
    postingId?: string;
    position?: IPosition,
    allowEdit?: boolean;
    user?: UserData;
    augmentedPosting?: IPosting;
    qualTypes?: string[];
}


/**
 * Defines the context object passed to Handlebars templates.
 */
interface HandlebarContext {
    event?: IEvent;
    args?: SidebarArgs;
    user?: UserData;
    augmentedPosting?: IPosting;
    postingId?: string;
    allowEdit?: boolean;
    isAssignedToSelf?: boolean;
    assignedUser?: UserData;
    sidebar?: { title: string };
    posting?: IPosting;
    position?: IPosition;
    qualifications?: {
        byType?: QualificationGroup[];
    };
    title?: string; // Used in addPosting for sidebar title
    userAgent?: {
        locale: Intl.ResolvedDateTimeFormatOptions;
    };
    userIsAllowed?: boolean; // For showing posting details
}

/**
 * Represents a group of qualifications, typically by type.
 */
interface QualificationGroup {
    _id: string;
    values: IQualification[];
}


// Extend jQuery for better type safety with custom AJAX methods
interface JQuery {
    ajax(settings: JQuery.AjaxSettings): JQuery.jqXHR;
    get(url: string, successCallback: (data: string) => void): JQuery.jqXHR;
    on(event: string, handler: JQuery.EventHandler<any, any>): JQuery;
    on(event: string, selector: string, handler: JQuery.EventHandler<any, any>): JQuery;
    val(value?: string | string[] | number): string | JQuery;
    html(htmlString: string): JQuery;
    addClass(className: string): JQuery;
    removeClass(className: string): JQuery;
    // Add other jQuery methods you use if they're not in the default JQuery definition
}
// Extend Date prototype (assuming these are defined in handlebarsHelpers or similar)
declare global {
    interface Date {
        toDateInputValue(): string;
        toTimeInputValue(): string;
    }
}





const eventPlugin = new SidebarPlugin("event");



const viewEvent = new ContentHandler("viewEvent",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string, handler: ContentHandler): Promise<HandlerFunctionResult> {
        const event = args.event;
        const context: HandlebarContext = {
            event: event,
            args: args,
        };
        let handlerFunctionResult = new HandlerFunctionResult()

        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-viewEvent.hbs');
            const template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");

            const titleInputContainer = document.getElementById("sidebar-eventDetails--titleRenderer");
            if (titleInputContainer) {
                new EditableInputField(titleInputContainer as HTMLElement, event.title.delta, "text", {}, { readOnly: true });
            }

            const descContainer = document.getElementById("sidebar-eventDetails--descRenderer");
            if (descContainer) {
                new EditableTextField(descContainer as HTMLElement, event.description.longDesc.delta, event.description.longDesc.html, {}, { readOnly: true });
            }

            sidebar.registerConfirmButton(".sidebar-confirm", {
                customHandler: true,
                handler: function() {
                    // Using 'this' context from bind(args) in original JS.
                    // In TypeScript, consider passing 'event' directly or using arrow function if 'this' is not needed.
                    window.location.href = `/events/${event.id}`;
                }.bind(args)
            });
        } catch (error) {
            const errMsg = "Failed to load event details."
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error loading viewEvent template or setting up input fields:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError)
        }

        return handlerFunctionResult;
    }
);



/**
 * Handles displaying editable event details.
 */
const eventDetails = new ContentHandler(
    "eventDetails",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string, handler: ContentHandler): Promise<HandlerFunctionResult> {
        const event = args.event;
        const context: HandlebarContext = {
            event: event,
            args: args,
        };

        let handlerFunctionResult = new HandlerFunctionResult()


        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-eventDetails.hbs');
            const template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");

            const titleInputContainer = document.getElementById("sidebar-eventDetails--titleRenderer");
            if (titleInputContainer) {
                new EditableInputField(titleInputContainer as HTMLElement, event.title.delta, "text", {}, { readOnly: true });
            }

            const descContainer = document.getElementById("sidebar-eventDetails--descRenderer");
            if (descContainer) {
                new EditableTextField(descContainer as HTMLElement, event.description.longDesc.delta, event.description.longDesc.html, {}, { readOnly: true });
            }
        }
        catch (error) {
            const errMsg = "Failed to load event details."
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error loading viewEvent template or setting up input fields:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError)
        }

        return handlerFunctionResult;

    }
);

const showEventParticipants = new ContentHandler("eventParticipants",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string, handler: ContentHandler): Promise<HandlerFunctionResult> {
        const onConfirm = args.callback?.onConfirm;

        let event = args.event;
        let context = {
            event: event,
            args: args,
        }

        let handlerFunctionResult = new HandlerFunctionResult()
        try {
            //populate
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-eventParticipants.hbs');
            let template = Handlebars.compile(data);
            sidebar.setHTMLContent((template(context)));

            sidebar.registerBackButton( ".sidebar-back-btn");
            // find if current user is registered for event
            let notRegisteredSelector = "#sidebar-participate-button-notregistered"
            let notRegistered = $(notRegisteredSelector);
            let registeredSelector = "#sidebar-participate-button-registered";
            let registered = $(registeredSelector);

            if (args.isParticipant) {
                notRegistered.addClass("hidden");
                registered.removeClass("hidden");
                registered.on("change", function (e) {
                    if ((e.target as HTMLButtonElement).value === "remove") {
                        args.callback.onDelete();
                    }
                })
            } else {
                sidebar.registerButton(notRegisteredSelector,
                    {
                        customHandler: true,
                        handler: function () {
                            if (onConfirm) {
                                onConfirm();
                            }
                        }
                    });
            }
        }

        catch (error) {
            const errMsg = "Huch, hier ist etwas schief gelaufen."
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error loading showPostings template:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError)
        }

        return handlerFunctionResult;
    });


let addEventParticipant = new ContentHandler("addEventParticipant",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string): Promise<HandlerFunctionResult> { // Added return type and typed parameters
        let event = args.event;
        let onConfirm = args.callback?.onConfirm; // Optional chaining
        let selectedUser = {id: "", role: "participant"}; // Explicitly type selectedUser and add id

        let handlerFunctionResult = new HandlerFunctionResult(); // Initialize HandlerFunctionResult

        let searchbar: Searchbar;
        let confirmButton: SidebarButton;

        try {
            //populate
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-eventParticipantsAdd.hbs'); // Use await with getTemplate
            let template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(event)); // Use setHTMLContent instead of sidebarHTML.html
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            confirmButton = new SidebarButton({
                sidebar: sidebar,
                selector: ".sidebar-confirm",
                type: "confirm",
                enabled: false,
                handler: function(){
                    let data: { userid: string; role: string; } = { // Explicitly type data
                        userid: selectedUser.id,
                        role: "participant", // Assuming role is always participant here
                    };
                    onConfirm?.(data); // Optional chaining
                }.bind(args)
            });
            // displayUserList()

            //setup searchbar
            let searchbarContainer = document.getElementById("usersearch");
            if (!searchbarContainer) {
                throw new Error("Searchbar container not found.");
            }
            searchbar = new Searchbar(searchbarContainer, {
                hidden: false,
                label: "Suche:",
                noIcon: true,
                enableCollapse: false,
                onInput: {
                    enabled: true,
                    callback: function(inputValue: string){ // Type inputValue
                        displayUserList(inputValue)
                    },
                },
                onFocus: {
                    enabled: true,
                    callback: function(inputValue: string){ // Type inputValue
                        displayUserList(inputValue)
                    }
                },
            });

        } catch (error) {
            const errMsg = "Failed to add event participant.";
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error in addEventParticipant:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError);
        }
        return handlerFunctionResult;

        //hook user query to input element
        function displayUserList(filter: string) { // Type filter

            let handleData: { userlist?: UserData[] } = {}; // Explicitly type handleData
            let data = {
                filter: filter,
                args: {
                    sort: "generalData.lastName.value",
                }};
            //get user list from server
            $.ajax({
                url: "/api/v1/usermod/filter",
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result: UserData[]) { // Type result
                    handleData.userlist = result;
                    // render userlist template
                    $.get('/webpack/sidebar/plugins/userselect-plugin.hbs', function (data: string) { // Type data
                        let template = Handlebars.compile(data);
                        appendContent(template(handleData))
                    });
                },
                error: function(XMLHttpRequest: JQuery.jqXHR, textStatus: string, errorThrown: string) { // Type parameters
                    alert("some error");
                }
            });

            function appendContent(html: string) { // Type html
                //append to subpage container #userlist-container
                let container = document.getElementById('sidebar-userselect-container');
                if (!container) {
                    console.error("User list container not found.");
                    return;
                }
                container.innerHTML = html;
                // const list = new MDCList(document.getElementById("addParticipantList"));

                //click on user selects it
                let items = $(".participant-item-selectable");
                items.on("mousedown", function(e: JQuery.Event) { // Type e
                    e.preventDefault(); //preventDefault to stop blur event before click is fired
                })
                items.each(function(){
                    this.addEventListener("click", function(this: HTMLElement){ // Type this
                        let userid = this.dataset.userid;
                        if (!userid) {
                            console.error("User ID not found on element.");
                            return;
                        }
                        //hide searchbar, display user item instead
                        let userentry = this.cloneNode(true) as HTMLElement; // Type userentry
                        userentry.classList.remove("participant-item-selectable");
                        searchbar.hide();
                        container.classList.add("hidden");
                        let resultContainer = document.getElementById("sidebar-userselect-result");
                        if (!resultContainer) {
                            console.error("Result container not found.");
                            return;
                        }

                        //create cancel btn
                        let cancelBtn = document.createElement("div");
                        cancelBtn.classList.add("before-icon",  "icon-cancel");
                        cancelBtn.addEventListener("click", function(){
                            //reset sidebar
                            sidebar.resetCurrentPage();
                        })
                        userentry.append(cancelBtn);

                        let c = document.createElement("div");
                        c.className = "event-participants";
                        c.append(userentry);
                        resultContainer.append(c);
                        selectedUser.id = userid;
                        confirmButton.enable();

                    });
                })

                // click outside should hide popup
                $(searchbar.getInputElement()).blur(function(){
                    if(searchbar.isActive) {
                        container.classList.add("hidden");
                    }
                });
                $(searchbar.getInputElement()).focus(function(){
                    //dont show when searchbar is disabled
                    if(searchbar.isActive){
                        container.classList.remove("hidden");
                    }
                })
            }
        }
    }
);


let assignUserSubpage = new ContentHandler("assignUserSubpage",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string): Promise<HandlerFunctionResult> { // Typed parameters and return
        let event = args.event;
        let postingId = args.postingId;
        let onConfirm = args.callback?.onConfirm; // Optional chaining
        let onCancel = args.callback?.onCancel; // Optional chaining
        let selectedUser: { id?: string; check?: any } = {}; // Explicitly type selectedUser

        let searchbar: Searchbar;
        let confirmButton: SidebarButton;

        let handlerFunctionResult = new HandlerFunctionResult(); // Initialize HandlerFunctionResult

        try {
            //populate
            const data = await getTemplate('/webpack/sidebar/templates/events/assignUserSubpage.hbs'); // Use await with getTemplate
            let template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(event)); // Use setHTMLContent
            let backBtn = sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel", {
                customHandler: true,
                handler: onCancel,
            });
            confirmButton = new SidebarButton({
                sidebar: sidebar,
                selector: ".sidebar-confirm",
                type: "confirm",
                enabled: false,
                handler: function(){
                    let data: { userid: string | undefined; check: any; } = { // Explicitly type data
                        userid: selectedUser.id,
                        check: selectedUser.check,
                    };
                    onConfirm?.(data); // Optional chaining
                }.bind(args)
            });
            // displayUserList()

            //setup searchbar
            let searchbarContainer = document.getElementById("usersearch");
            if (!searchbarContainer) {
                throw new Error("Searchbar container not found.");
            }
            searchbar = new Searchbar(searchbarContainer, {
                hidden: false,
                label: "Suche:",
                noIcon: true,
                enableCollapse: false,
                onInput: {
                    enabled: true,
                    callback: function(inputValue: string){ // Type inputValue
                        displayUserList(inputValue)
                    },
                },
                onFocus: {
                    enabled: true,
                    callback: function(inputValue: string){ // Type inputValue
                        displayUserList(inputValue)
                    }
                },
            });


            //hook user query to input element

        } catch (error) {
            const errMsg = "Failed to assign user.";
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error in assignUserSubpage:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError);
        }
        return handlerFunctionResult;

        function displayUserList(filter: string) { // Type filter

            let handleData: { userlist?: UserData[] } = {}; // Explicitly type handleData
            let data = {
                filter: filter,
                args: {
                    sort: "generalData.lastName.value",
                }};
            //get user list from server
            $.ajax({
                url: "/api/v1/usermod/filter",
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result: UserData[]) { // Type result
                    handleData.userlist = result;
                    // render userlist template
                    $.get('/webpack/sidebar/plugins/userselect-plugin.hbs', function (data: string) { // Type data
                        let template = Handlebars.compile(data);
                        appendContent(template(handleData))
                    });
                },
                error: function(XMLHttpRequest: JQuery.jqXHR, textStatus: string, errorThrown: string) { // Type parameters
                    alert("some error");
                }
            });

            function appendContent(html: string) { // Type html
                //append to subpage container #userlist-container
                let container = document.getElementById('sidebar-userselect-container');
                if (!container) {
                    console.error("User list container not found.");
                    return;
                }
                container.innerHTML = html;
                // const list = new MDCList(document.getElementById("addParticipantList"));

                //click on user selects it
                let items = $(".participant-item-selectable");
                items.on("mousedown", function(e: JQuery.Event) { // Type e
                    e.preventDefault(); //preventDefault to stop blur event before click is fired
                })
                items.each(function(){
                    this.addEventListener("click", function(this: HTMLElement){ // Type this
                        let userid = this.dataset.userid;
                        if (!userid) {
                            console.error("User ID not found on element.");
                            return;
                        }
                        //hide searchbar, display user item instead
                        let userentry = this.cloneNode(true) as HTMLElement; // Type userentry
                        userentry.classList.remove("participant-item-selectable");
                        userentry.classList.add("userentry-result");
                        searchbar.hide();
                        container.classList.add("hidden");
                        let resultContainer = document.getElementById("sidebar-userselect-result");
                        if (!resultContainer) {
                            console.error("Result container not found.");
                            return;
                        }

                        //create cancel btn
                        let cancelBtn = document.createElement("div");
                        cancelBtn.classList.add("before-icon",  "icon-cancel");
                        cancelBtn.addEventListener("click", function(){
                            //reset sidebar
                            sidebar.resetCurrentPage();
                        })
                        userentry.append(cancelBtn);

                        let checkPanel = document.getElementById("label-spinner");
                        if (checkPanel) { // Check if element exists
                            checkPanel.classList.add("label-active");
                        }

                        let c = document.createElement("div");
                        c.className = "event-participants";
                        c.append(userentry);
                        resultContainer.append(c);
                        selectedUser.id = userid;

                        checkUser(userid, event.id.toString(), postingId)
                            .then(result => {
                                selectedUser.check = result;
                                if(result.allowed) {
                                    confirmButton.enable();
                                    //display allow info panel
                                    if (checkPanel) { // Check if element exists
                                        checkPanel.classList.remove("label-active");
                                    }
                                    let allowedPanel = document.getElementById("label-isAllowed");
                                    if (allowedPanel) { // Check if element exists
                                        allowedPanel.classList.add("label-active");
                                    }
                                }
                                else {
                                    //display blocked info panel
                                    let reason = "";
                                    if (result.hasOverlap) {
                                        if(result.overlap) reason = "Anderes Event zur gleichen Zeit: " + result.overlap.event.title.value;
                                        else reason = "Anderes Event zur gleichen Zeit."
                                    }
                                    if (!result.matchesQualification) {
                                        reason = "Fehlende Qualifikation.";
                                    }
                                    if (checkPanel) { // Check if element exists
                                        checkPanel.classList.remove("label-active");
                                    }
                                    let allowedPanel = document.getElementById("label-notAllowed");
                                    if (allowedPanel) { // Check if element exists
                                        allowedPanel.classList.add("label-active");
                                    }
                                    let textContent = document.getElementById("label-notAllowed-content--text");
                                    if (textContent) { // Check if element exists
                                        textContent.innerHTML = reason;
                                    }
                                }

                            })
                            .catch(err => {throw new Error(err)})

                    });
                })

                // click outside should hide popup
                $(searchbar.getInputElement()).blur(function(){
                    if(searchbar.isActive) {
                        container.classList.add("hidden");
                    }
                });
                $(searchbar.getInputElement()).focus(function(){
                    //dont show when searchbar is disabled
                    if(searchbar.isActive){
                        container.classList.remove("hidden");
                    }
                })
            }

            function checkUser(userId: string, eventId: string, postingId: string | undefined): Promise<any>{ // Typed parameters and return
                return new Promise(function(resolve, reject){
                    let data = {
                        userId: userId,
                        eventId: eventId,
                        postingId: postingId,
                    }
                    $.ajax({
                        url: "/api/v1/eventmod/checkUserForAssignment",
                        type: 'POST',
                        contentType: "application/json; charset=UTF-8",
                        dataType: 'json',
                        data: JSON.stringify(data),
                        success: function(result: any) { // Type result
                            resolve(result)
                        },
                        error: function(XMLHttpRequest: JQuery.jqXHR, textStatus: string, errorThrown: string) { // Type parameters
                            reject(errorThrown)
                        }
                    });
                })
            }
        }
    }
    );


let showUpdateEventDateContent = new ContentHandler("editEventDate",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string): Promise<HandlerFunctionResult> { // Typed parameters and return
        let onConfirm = args.callback?.onConfirm; // Optional chaining
        let onDelete = args.callback?.onDelete; // Optional chaining

        let context: HandlebarContext = { // Explicitly type context
            userAgent: {
                locale: Intl.DateTimeFormat().resolvedOptions()
            },
            event: args.event, // Assign args.event to context.event
        };

        let handlerFunctionResult = new HandlerFunctionResult(); // Initialize HandlerFunctionResult

        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-updateEventDate.hbs'); // Use await with getTemplate

            let template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context)); // Use setHTMLContent

            let currentStartDate = new Date(context.event!.date.startDate); // Use non-null assertion and optional chaining
            let currentEndDate = new Date(context.event!.date.endDate); // Use non-null assertion and optional chaining
            if (isNaN(currentStartDate.getFullYear()) || isNaN(currentEndDate.getFullYear())) {
                currentStartDate = new Date();
                currentEndDate = new Date();
                console.warn("trying to read corrupted data");
                sidebar.addErrorMessage("Failed to read event date from database. Please set a new date.",  function(errorHTML: HTMLElement){ // Type errorHTML
                    $("#sidebar-inner").before(errorHTML);
                }, false, true);
            }

            let d1 = document.getElementById("eventinp-date") as HTMLInputElement; // Type as HTMLInputElement
            let t1 = document.getElementById("eventinp-timeStart") as HTMLInputElement; // Type as HTMLInputElement
            // let d2 = document.getElementById("endDate-input");
            let t2 = document.getElementById("eventinp-timeEnd") as HTMLInputElement; // Type as HTMLInputElement
            let l = document.getElementById("eventinp-location") as HTMLInputElement; // Type as HTMLInputElement

            $(d1).val(currentStartDate.toDateInputValue())
            $(t1).val(currentStartDate.toTimeInputValue())
            $(t2).val(currentEndDate.toTimeInputValue())

            sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        let date = $(d1).val();
                        let startTime = $(t1).val();
                        let endTime = $(t2).val();
                        let location = $(l).val();

                        let data = {
                            date: date,
                            startTime: startTime,
                            endTime: endTime,
                            location: location,
                        }
                        onConfirm?.(args.event, data, {}); // Optional chaining
                    }.bind(args)
                });
        } catch (error) {
            const errMsg = "Failed to update event date.";
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error in showUpdateEventDateContent:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError);
        }
        return handlerFunctionResult;
    }
)


let showUpdateEventLocationContent = new ContentHandler("editEventLocation",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string): Promise<HandlerFunctionResult> { // Typed parameters and return
        let onConfirm = args.callback?.onConfirm; // Optional chaining

        let context: HandlebarContext = { // Explicitly type context
            event: args.event, // Assign args.event to context.event
        };

        let handlerFunctionResult = new HandlerFunctionResult(); // Initialize HandlerFunctionResult

        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-updateEventLocation.hbs'); // Use await with getTemplate

            let template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context)); // Use setHTMLContent

            let location = context.event?.location.value; // Optional chaining
            if (location === undefined) {
                console.warn("trying to read corrupted data");
                sidebar.addErrorMessage("Failed to read event location from database.",  function(errorHTML: HTMLElement){ // Type errorHTML
                    $("#sidebar-inner").before(errorHTML);
                }, false, true);
            }
            let l = document.getElementById("eventinp-location") as HTMLInputElement; // Type as HTMLInputElement

            if (l && location !== undefined) {
                l.value = location; // Initialize input with existing location
            }

            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        let updatedLocation = l?.value;

                        let updateData = {
                            location: updatedLocation,
                        }
                        if (onConfirm && args.event) {
                            onConfirm(args.event, updateData, {});
                        }
                    }.bind(args)
                }
            );
        }
        catch (error) {
            const errMsg = "Failed to update event location.";
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error in showUpdateEventLocationContent:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError);
        }
        return handlerFunctionResult;
    }
    )

let showPostings = new ContentHandler("eventPostings",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string): Promise<HandlerFunctionResult> { // Typed parameters and return
        let onConfirm = args.callback?.onConfirm; // Optional chaining

        let context: HandlebarContext = { // Explicitly type context
            event: args.event, // Assign args.event to context.event
        };

        let handlerFunctionResult = new HandlerFunctionResult(); // Initialize HandlerFunctionResult

        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-eventPostings.hbs'); // Use await with getTemplate

            let template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context)); // Use setHTMLContent

            sidebar.registerBackButton(".sidebar-back-btn");

            let notRegisteredSelector = "#sidebar-participate-button-notregistered"
            let notRegistered = $(notRegisteredSelector);
            let registeredSelector = "#sidebar-participate-button-registered";
            let registered = $(registeredSelector);

            if (args.isParticipant) {
                notRegistered.addClass("hidden");
                registered.removeClass("hidden");
            } else {
                sidebar.registerButton(notRegisteredSelector,
                    {
                        customHandler: true,
                        handler: function () {
                            if (onConfirm) {
                                onConfirm();
                            }
                        }
                    });
            }
        }
        catch (error) {
            const errMsg = "Huch, hier ist etwas schief gelaufen."
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error loading showPostings template:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError)
        }
        return handlerFunctionResult;
    }
)

/**
 * Provides a form to add a new posting to an event, including qualification selection.
 */
const addPosting = new ContentHandler(
    "addEventPosting",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string, handler: ContentHandler): Promise<HandlerFunctionResult> {
        const onConfirm = args.callback?.onConfirm;

        const context: HandlebarContext = {
            event: args.event,
            title: "Dienstposten erstellen",
            args: args,
        };

        let handlerFunctionResult = new HandlerFunctionResult()

        const res: { qualifications: { byType?: QualificationGroup[] } } = { qualifications: {} };

        try {
            const fetchedQuals: QualificationGroup[] = await qualificationActions.getGrouped();

            const qualTypeFilters = args.qualTypes;
            if (Array.isArray(qualTypeFilters) && qualTypeFilters.length > 0) {
                res.qualifications.byType = fetchedQuals.filter((qualGroup: QualificationGroup) =>
                    qualTypeFilters.includes(qualGroup._id)
                );
            } else {
                res.qualifications.byType = fetchedQuals;
            }

            const templateData = await getTemplate('/webpack/sidebar/templates/events/sidebar-addEventPosting.hbs');
            const template = Handlebars.compile(templateData);

            context.qualifications = res.qualifications;
            sidebar.setHTMLContent(template(context));

            const chipset = new MDCChipSet(document.querySelector('.mdc-evolution-chip-set'));

            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm", {
                customHandler: true,
                handler: () => {
                    const isOptionalCheckbox = document.getElementById("isOptional-checkbox") as HTMLInputElement;
                    const allowHigherCheckbox = document.getElementById("allowHigher-checkbox") as HTMLInputElement;
                    const qualNameSelect = document.getElementById("qual-name") as HTMLSelectElement;
                    const postingDescription = $("#posting-description").val() as string;
                    const timeStartInput = document.getElementById("eventinp-timeStart") as HTMLInputElement;
                    const timeEndInput = document.getElementById("eventinp-timeEnd") as HTMLInputElement;
                    const positionInput = document.getElementById("eventinp-position") as HTMLInputElement;

                    const optional = isOptionalCheckbox?.checked || false;
                    const enabled = true;
                    const allowHigher = allowHigherCheckbox?.checked || false;
                    const qualId = qualNameSelect?.selectedOptions[0]?.id;

                    if (!qualId || !context.event?.date.startDate) {
                        console.error("Missing qualification ID or event start date for new posting.");
                        sidebar.addErrorMessage("Please select a qualification and ensure event date is set.", (errorHTML: HTMLElement) => {
                            $("#sidebar-inner").before(errorHTML);
                        }, false, true);
                        return;
                    }

                    const postingData = {
                        qualifications: [qualId],
                        description: postingDescription,
                        allowHigher: allowHigher,
                        optional: optional,
                        enabled: enabled,
                        startTime: timeStartInput.value,
                        endTime: timeEndInput.value,
                    };
                    if (onConfirm) {
                        onConfirm(postingData, {});
                    }
                }
            });

            const levelObject = document.getElementById("qual-level") as HTMLInputElement;
            const qualTypeSelect = $("#qual-type");
            const qualNameSelect = document.getElementById("qual-name") as HTMLSelectElement;

            qualTypeSelect.on("change", (e: JQuery.ChangeEvent) => {
                const targetValue = (e.target as HTMLSelectElement).value;
                const typeData = res.qualifications.byType?.find(element => element._id === targetValue);

                if (qualNameSelect) qualNameSelect.options.length = 0; // Clear existing options

                if (typeData && qualNameSelect) {
                    typeData.values.forEach((el, index) => {
                        const option = document.createElement('option');
                        option.id = el._id.toString();
                        option.dataset.qualid = el._id.toString();
                        option.value = el.name;
                        option.innerHTML = el.name;
                        qualNameSelect.options[index] = option;
                    });
                }
                $(qualNameSelect).trigger("change"); // Trigger change on name select after updating
            });

            $(qualNameSelect).on("change", (e: JQuery.ChangeEvent) => {
                const selectedOption = (e.target as HTMLSelectElement).selectedOptions[0];
                const qualId = selectedOption?.dataset.qualid;

                if (qualId && res.qualifications.byType && levelObject) {
                    const qual = sidebar.findQualByIdInTypeArray(res.qualifications.byType, qualId);
                    if (qual) {
                        levelObject.value = qual.level;
                    }
                }
            });
            $(qualNameSelect).trigger("change"); // Initial trigger to populate name and level
        }

        catch (error) {
            const errMsg = "Huch, hier ist etwas schief gelaufen."
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error loading addPosting template or qualifications:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError)
        }

        return handlerFunctionResult;
    }
);

let showPostingDetails = new ContentHandler("showPostingDetails",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string): Promise<HandlerFunctionResult> {
        const onDelete = args.callback?.onDelete;
        const onConfirm = args.callback?.onConfirm;
        const onAssign = args.callback?.onAssign;
        const onUnassign = args.callback?.onUnassign;

        let context: HandlebarContext = {};
        if (args.allowEdit === undefined) args.allowEdit = false; // Ensure allowEdit is boolean
        context.user = args.user;
        context.augmentedPosting = args.augmentedPosting;
        context.postingId = args.postingId;
        context.event = args.event;
        context.allowEdit = args.allowEdit;
        context.args = args;
        context.isAssignedToSelf = false;
        context.assignedUser = undefined;
        let corrupted = false;
        let hasChanges = false;
        const event = args.event;

        context.sidebar = {title: (args.allowEdit ? "Dienstposten bearbeiten" : "Details: Dienstposten")};

        let posting: IPosting | undefined = context.augmentedPosting;
        if (context.augmentedPosting === undefined && context.event) { // Check for context.event
            //find posting
            posting = context.event.postings.find(el => {
                return el._id.toString() === context.postingId;
            })
            if(posting === undefined) {
                posting = {
                    _id: '', // Use postingId if available
                    requiredQualifications: [],
                    title: "",
                    description: "",
                    allowHigher: false,
                    optional: false,
                    enabled: false,
                    date: { startDate: event.date.startDate, endDate: event.date.endDate },
                    assigned: { isAssigned: false },
                };
                corrupted = true;
            }
        }

        if (posting?.assigned?.isAssigned && posting.assigned.user) { // Check if posting.assigned and posting.assigned.user exist
            context.assignedUser = posting.assigned.user;
            //check if self is assigned
            if (context.user && posting.assigned.user.id?.toString() === context.user.id?.toString()) { // Check if context.user and user.id exist
                context.isAssignedToSelf = true;
            }
        }

        context.posting = posting;

        // Ensure user and posting are not undefined before passing to getMatchingQualifications
        if (context.user && posting) {
            //@ts-ignore
            let matchingQualifications = getMatchingQualifications(context.user, posting);
            context.userIsAllowed = (matchingQualifications.length > 0);
        } else {
            context.userIsAllowed = false; // Set to false if user or posting is missing
        }

        let handlerFunctionResult = new HandlerFunctionResult(); // Initialize HandlerFunctionResult

        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-showPostingDetails.hbs');
            let template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context)); // Use setHTMLContent

            //create tooltips
            let tooltipSetup = [
                {   id: "button--blockedGlobally",
                    content: "Anmeldung nicht möglich: Du bist zur gleichen Zeit für ein anderes Event gemeldet."},
                {   id: "button--blockedLocally",
                    content: "Anmeldung nicht möglich: Du bist zur gleichen Zeit für dieses Event bereits gemeldet"},
                {   id: "button--blockedRequirement",
                    content: "Anmeldung nicht möglich: Du hast nicht die erforderliche Qualifikation."},
            ]
            tooltipSetup.forEach(tt => {
                let element = document.getElementById(tt.id);
                if (!(element === undefined || element === null)){
                    let tooltip = new SidebarTooltip({
                        anchor: element,
                        content: tt.content,
                    });
                }
            })
            let t1: HTMLInputElement | null = null; // Initialize with null
            let t2: HTMLInputElement | null = null; // Initialize with null
            if(args.allowEdit && posting?.date) { // Check if posting.date exists
                let currentStartDate = new Date(posting.date.startDate);
                let currentEndDate = new Date(posting.date.endDate);
                if (isNaN(currentStartDate.getFullYear()) || isNaN(currentEndDate.getFullYear())) {
                    currentStartDate = new Date();
                    currentEndDate = new Date();
                    corrupted = true;
                }
                else {
                    t1 = document.getElementById("eventinp-timeStart") as HTMLInputElement;
                    t2 = document.getElementById("eventinp-timeEnd") as HTMLInputElement;
                    t1.value = currentStartDate.toTimeInputValue()
                    t2.value = currentEndDate.toTimeInputValue()
                }
            }

            if(corrupted) {
                const errMsg = "Corrupted data detected: Failed to find selected posting."
                sidebar.addErrorMessage("Fehler: Dienstposten konnte ich nicht gefunden werden.", function(html: HTMLElement){ // Type html
                    //find .sidebar-inner
                    document.getElementById("sidebar-inner")?.prepend(html); // Use optional chaining
                })
                handlerFunctionResult.addError(new HandlerFunctionError(errMsg));
                return handlerFunctionResult; // Return HandlerFunctionResult on error
            }

            sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");

            if(posting?.assigned.isAssigned && posting.assigned.user){ // Check if posting.assigned and posting.assigned.user exist
                if (args.allowEdit || context.isAssignedToSelf) {
                    let unassignButton = sidebar.registerButton(".sidebar-unassign",
                        {
                            type: "delete",
                            customHandler: true,
                            handler: function(){
                                let data = {
                                    event: context.event,
                                    userId: context.assignedUser?.id?.toString(), // Optional chaining
                                    postingId: context.postingId
                                }
                                onUnassign?.(data); // Optional chaining
                            },
                            enabled: true,
                        }
                    )
                }

            }
            else {
                const assignSelfButtonElement = sidebar.container.querySelector(".sidebar-assignSelf");
                if(assignSelfButtonElement) {
                    let assignSelfButton = sidebar.registerButton(".sidebar-assignSelf",
                        {
                            type: "allowed",
                            customHandler: true,
                            handler: function(){
                                let data = {
                                    event: context.event,
                                    userId: context.user?.id, // Optional chaining
                                    postingId: context.postingId
                                }
                                onAssign?.(data); // Optional chaining
                            },
                        }
                    )
                }

                let assignButton = sidebar.registerButton(".sidebar-assign",
                    {
                        type: "custom",
                        customHandler: true,
                        handler: function(){
                            //save current sidebar content
                            let currentContent = sidebar.saveContent();
                            //show assign user sidebar
                            sidebar.addContent("assignUserSubpage", {
                                event: context.event!, // Non-null assertion, assuming event always exists here
                                postingId: context.postingId,
                                callback: {
                                    onConfirm: function(result: {userid: string, check: any}){ // Type result
                                        let userId = result.userid;
                                        let checkResult = result.check;
                                        //restore sidebar content
                                        sidebar.loadContent(currentContent)
                                        //assign user to post
                                        let data = {
                                            event: context.event,
                                            userId: userId,
                                            postingId: context.postingId
                                        }
                                        onAssign?.(data); // Optional chaining
                                    },
                                    onCancel: function(){
                                        //restore sidebar content
                                        sidebar.loadContent(currentContent)
                                    }
                                }
                            })
                        },
                    }
                )
            }

            let confirmButton = sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    enabled: (context.allowEdit && !corrupted && hasChanges),
                    handler: function () {
                        const optional = (document.getElementById("isOptional-checkbox") as HTMLInputElement)?.checked; // Type assertion and optional chaining
                        const enabled = true;
                        const allowHigher = (document.getElementById("allowHigher-checkbox") as HTMLInputElement)?.checked; // Type assertion and optional chaining
                        const descriptionElement = $("#posting-description");
                        const data: ShowPostingConfirmPayload = {
                            id: context.postingId,
                            description: descriptionElement.val() as string, // Type assertion
                            optional: optional,
                            enabled: enabled,
                            allowHigher: allowHigher,
                            date: event.date.startDate,
                            startTime: t1?.value,
                            endTime: t2?.value,
                            qualifications: []
                        };
                        onConfirm?.(data, {}); // Optional chaining
                    }.bind(args)
                });

            let deleteBtn = sidebar.registerDeleteButton(".sidebar-delete",
                {
                    customHandler: true,
                    enabled: context.allowEdit,
                    handler: function(){
                        let data = {
                            id: context.postingId,
                        }
                        onDelete?.(data); // Optional chaining
                    },
                });

            $(sidebar.getHTMLContent()).find("input").each((index: number, el: HTMLElement) => { // Typed index and el, and use getHTMLContent
                el.addEventListener("input", function(e){
                    hasChanges = true;
                    confirmButton.enable(context.allowEdit && !corrupted);
                })
            })
        } catch (error) {
            const errMsg = "Failed to show posting details.";
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error in showPostingDetails:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError);
        }
        return handlerFunctionResult;
    }
);


let showEventPositionContent = new ContentHandler("eventPosition",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string): Promise<HandlerFunctionResult> { // Typed parameters and return

        let onConfirm = args.callback?.onConfirm; // Optional chaining
        let position: IPosition = args.position ? args.position : {title: "", description: ""};
        let context: HandlebarContext = { // Explicitly type context
            event: args.event, // Assign args.event to context.event
            position: position,
        };

        let handlerFunctionResult = new HandlerFunctionResult(); // Initialize HandlerFunctionResult

        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-updateEventPosition.hbs'); // Use await with getTemplate

            let template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context)); // Use setHTMLContent

            let titleInputElement = document.getElementById("eventinp-positionTitle") as HTMLInputElement; // Type as HTMLInputElement
            let descriptionInputElement = document.getElementById("eventinp-positionDescription") as HTMLInputElement; // Type as HTMLInputElement

            if(position.title) {
                titleInputElement.value = position.title;
            }
            if(position.description) {
                descriptionInputElement.value = position.description;
            }

            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        let updatedTitle = titleInputElement?.value;
                        let updateDescription = descriptionInputElement?.value;

                        let updateData = {
                            title: updatedTitle,
                            description: updateDescription,
                        }
                        if (onConfirm && args.event) {
                            onConfirm(updateData, {});
                        }
                    }.bind(args)
                }
            );
        }
        catch (error) {
            const errMsg = "Failed to update event position.";
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error in showEventPositionContent:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError);
        }
        return handlerFunctionResult;
    }
)


eventPlugin.addContentHandler(eventDetails);
eventPlugin.addContentHandler(showEventParticipants);
eventPlugin.addContentHandler(addEventParticipant);
eventPlugin.addContentHandler(showUpdateEventDateContent);
eventPlugin.addContentHandler(showUpdateEventLocationContent);
eventPlugin.addContentHandler(showPostings);
eventPlugin.addContentHandler(addPosting);
eventPlugin.addContentHandler(showPostingDetails);
eventPlugin.addContentHandler(assignUserSubpage);
eventPlugin.addContentHandler(viewEvent);
eventPlugin.addContentHandler(showEventPositionContent);

export {eventPlugin}