// Imports for styling
import "../sidebar-events.scss";
import "../sidebar-addParticipant.scss";

import {type IEventBlueprint, IPosting} from "../../types/EventBlueprint"
import {type IQualification} from "../../types/Qualification";

// Imports for classes and utilities
import SidebarPlugin from "../SidebarPlugin";
import ContentHandler from "../ContentHandler";
import SidebarButton from "../SidebarButton";
import SidebarTooltip from "../SidebarTooltip";
import { Searchbar } from "../../searchbar/searchbar";

// Import Handlebars (CommonJS module)
import Handlebars from "handlebars";
import "../../helpers/handlebarsHelpers"; // Assuming this handles Date prototype extensions too
import { getMatchingQualifications } from "../../helpers/helpers";
import EditableInputField from "../../helpers/EditableInputField";
import { EditableTextField } from "../../helpers/editableTextField";
import Sidebar from "../Sidebar";
import HandlerFunctionResult from "../HandlerFunctionResult";
import HandlerFunctionError from "../HandlerFunctionError";
import {fetchData, getTemplate} from "../utils";
import eventBlueprintActions from "../../actions/eventBlueprintActions";
import qualificationActions from "../../actions/qualificationActions";

// ---
// Interfaces for Type Safety
// ---


/**
 * Represents a user's basic data.
 */
interface UserData {
    id: string;
    generalData?: {
        lastName?: { value: string };
    };
    // Add other user properties as needed
}

/**
 * Defines the structure for arguments passed to ContentHandler functions.
 */
interface SidebarArgs {
    event: IEventBlueprint;
    isParticipant?: boolean;
    callback?: {
        onConfirm?: (...args: any[]) => void;
        onDelete?: (...args: any[]) => void;
        onCancel?: (...args: any[]) => void;
        onAssign?: (...args: any[]) => void;
        onUnassign?: (...args: any[]) => void;
    };
    postingId?: string;
    allowEdit?: boolean;
    user?: UserData;
    augmentedPosting?: IPosting;
    qualTypes?: string[];
}

/**
 * Defines the context object passed to Handlebars templates.
 */
interface HandlebarContext {
    event?: IEventBlueprint;
    args?: SidebarArgs;
    user?: UserData;
    augmentedPosting?: IPosting;
    postingId?: string;
    allowEdit?: boolean;
    isAssignedToSelf?: boolean;
    assignedUser?: UserData;
    sidebar?: { title: string };
    posting?: IPosting;
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

// ---
// Sidebar Plugin Instance
// ---
const eventFactoryPlugin = new SidebarPlugin("eventFactory");

// ---
// Content Handlers
// ---

/**
 * Handles displaying the details of an event in read-only mode.
 */
const viewEvent = new ContentHandler(
    "viewEvent",
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

/**
 * Displays and allows updating of an event's date and time.
 */
const showUpdateEventDateContent = new ContentHandler(
    "editEventDate",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string, handler: ContentHandler): Promise<HandlerFunctionResult> {
        const onConfirm = args.callback?.onConfirm;

        const context: HandlebarContext = {
            userAgent: {
                locale: Intl.DateTimeFormat().resolvedOptions()
            },
            event: args.event,
        };

        let handlerFunctionResult = new HandlerFunctionResult()


        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-updateEventDate.hbs');
            const template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context));

            let currentStartDate = new Date(context.event?.date.startDate || '');
            let currentEndDate = new Date(context.event?.date.endDate || '');

            if (isNaN(currentStartDate.getFullYear()) || isNaN(currentEndDate.getFullYear())) {
                currentStartDate = new Date(); // Default to current date if corrupted
                currentEndDate = new Date();
                console.warn("Trying to read corrupted event date data. Defaulting to current date.");
                sidebar.addErrorMessage("Failed to read event date from database. Please set a new date.", (errorHTML: HTMLElement) => {
                    $("#sidebar-inner").before(errorHTML);
                }, false, true);
            }

            const d1 = document.getElementById("eventinp-date") as HTMLInputElement;
            const t1 = document.getElementById("eventinp-timeStart") as HTMLInputElement;
            const t2 = document.getElementById("eventinp-timeEnd") as HTMLInputElement;
            const l = document.getElementById("eventinp-location") as HTMLInputElement; // Check if location is truly part of this form

            if (d1) $(d1).val(currentStartDate.toDateInputValue());
            if (t1) $(t1).val(currentStartDate.toTimeInputValue());
            if (t2) $(t2).val(currentEndDate.toTimeInputValue());
            if (l && context.event?.location) $(l).val(context.event.location.value); // Pre-fill location if available and input exists

            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm", {
                customHandler: true,
                handler: () => {
                    const date = d1?.value;
                    const startTime = t1?.value;
                    const endTime = t2?.value;
                    const location = l?.value; // Still including location if it's part of this form

                    const updateData = {
                        date: date,
                        startTime: startTime,
                        endTime: endTime,
                        location: location,
                    };
                    if (onConfirm && args.event) {
                        onConfirm(args.event, updateData, {});
                    }
                }
            });
        }
        catch (error) {
            const errMsg = "Failed to load event date update form."
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error loading showUpdateEventDateContent template:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError)
        }

        return handlerFunctionResult;
    }
);


/**
 * Displays and allows updating of an event's location.
 */
const showUpdateEventLocationContent = new ContentHandler(
    "editEventLocation",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string, handler: ContentHandler): Promise<HandlerFunctionResult> {
        const onConfirm = args.callback?.onConfirm;

        const context: HandlebarContext = {
            event: args.event,
        };

        let handlerFunctionResult = new HandlerFunctionResult()


        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-updateEventLocation.hbs');
            const template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context));

            const location = context.event?.location.value;
            if (location === undefined) {
                console.warn("Trying to read corrupted event location data.");
                sidebar.addErrorMessage("Failed to read event location from database.", (errorHTML: HTMLElement) => {
                    $("#sidebar-inner").before(errorHTML);
                }, false, true);
            }
            const l = document.getElementById("eventinp-location") as HTMLInputElement;

            if (l && location !== undefined) {
                l.value = location; // Initialize input with existing location
            }

            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm", {
                customHandler: true,
                handler: () => {
                    const updatedLocation = l?.value;

                    const updateData = {
                        location: updatedLocation,
                    };
                    if (onConfirm && args.event) {
                        onConfirm(args.event, updateData, {});
                    }
                }
            });
        }
        catch (error) {
            const errMsg = "Failed to load event date update form."
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error loading showUpdateEventLocationContent template:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError)
        }

        return handlerFunctionResult;

    }
);


/**
 * Displays a list of postings associated with an event.
 */
const showPostings = new ContentHandler(
    "eventPostings",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string, handler: ContentHandler): Promise<HandlerFunctionResult> {
        const onConfirm = args.callback?.onConfirm;

        const context: HandlebarContext = {
            event: args.event,
        };

        let handlerFunctionResult = new HandlerFunctionResult()


        try {
            const data = await getTemplate('/webpack/sidebar/templates/events/sidebar-eventPostings.hbs');
            const template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context));

            sidebar.registerBackButton(".sidebar-back-btn");

            const notRegisteredSelector = "#sidebar-participate-button-notregistered";
            const notRegistered = $(notRegisteredSelector);
            const registeredSelector = "#sidebar-participate-button-registered";
            const registered = $(registeredSelector);

            if (args.isParticipant) {
                notRegistered.addClass("hidden");
                registered.removeClass("hidden");
            } else {
                sidebar.registerButton(notRegisteredSelector, {
                    customHandler: true,
                    handler: () => {
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
);



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
                    };
                    const postingArgs = {
                        startTime: timeStartInput?.value,
                        endTime: timeEndInput?.value,
                    };
                    if (onConfirm) {
                        onConfirm(postingData, postingArgs);
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
                        option.id = el.id.toString();
                        option.dataset.qualid = el.id.toString();
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



/**
 * Displays detailed information about a specific event posting,
 * including options for editing, deleting, assigning, and unassigning users.
 */
const showPostingDetails = new ContentHandler(
    "showPostingDetails",
    async function(sidebar: Sidebar, args: SidebarArgs, type: string, handler: ContentHandler): Promise<HandlerFunctionResult> {
        const onDelete = args.callback?.onDelete;
        const onConfirm = args.callback?.onConfirm;
        const onAssign = args.callback?.onAssign;
        const onUnassign = args.callback?.onUnassign;

        let handlerFunctionResult = new HandlerFunctionResult()

        let corrupted = false;
        let hasChanges = false;


        const context: HandlebarContext = {
            user: args.user,
            augmentedPosting: args.augmentedPosting,
            postingId: args.postingId,
            event: args.event,
            allowEdit: args.allowEdit ?? false, // Default to false if undefined
            args: args,
            isAssignedToSelf: false,
            assignedUser: undefined,
            sidebar: { title: (args.allowEdit ? "Dienstposten bearbeiten" : "Details: Dienstposten") },
        };

        let posting = context.augmentedPosting;

        if (!posting && context.event?.postings && context.postingId) {
            posting = context.event.postings.find(el => el.id.toString() === context.postingId);
            if (!posting) {
                console.warn("Posting not found or corrupted. Initializing with default values.");
                // Provide minimal default values to prevent crashes if posting is not found
                posting = {
                    id: '', // Use postingId if available
                    requiredQualifications: [],
                    title: "",
                    description: "",
                    allowHigher: false,
                    optional: false,
                    enabled: false,
                    date: { startTime: undefined, endTime: undefined },
                };
                corrupted = true;
            }
        }
        context.posting = posting;


        try {
            const templateData = await getTemplate('/webpack/sidebar/templates/events/sidebar-showPostingDetails.hbs');
            const template = Handlebars.compile(templateData);
            sidebar.setHTMLContent(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");
            // Handle edit mode for posting details
            if (posting) {
                const timeStartInput = document.getElementById("eventinp-timeStart") as HTMLInputElement;
                const timeEndInput = document.getElementById("eventinp-timeEnd") as HTMLInputElement;

                let currentStartDate = new Date(posting.date.startTime);
                let currentEndDate = new Date(posting.date.endTime);
                if (isNaN(currentStartDate.getFullYear()) || isNaN(currentEndDate.getFullYear())) {
                    currentStartDate = new Date();
                    currentEndDate = new Date();
                    corrupted = true;
                }
                else {
                    $(timeStartInput).val(currentStartDate.toTimeInputValue())
                    $(timeEndInput).val(currentEndDate.toTimeInputValue())
                }

                if(corrupted) {
                    throw new Error("Corrupted data detected: Failed to find selected posting.")
                }

                let confirmButton = sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        enabled: (!corrupted && hasChanges),
                        handler: function () {
                            const optionalCheckbox = document.getElementById("isOptional-checkbox") as HTMLInputElement
                            const optional = optionalCheckbox.checked;
                            const enabled = true;
                            const allowHigherCheckbox = document.getElementById("allowHigher-checkbox") as HTMLInputElement
                            const allowHigher = allowHigherCheckbox.checked;
                            const data = {
                                id: context.postingId,
                                description: $("#posting-description").val(), //string
                                optional: optional,
                                enabled: enabled,
                                allowHigher: allowHigher,
                            };
                            const args = {
                                startTime: timeStartInput.value,
                                endTime: timeEndInput.value,
                            }
                            onConfirm(data, args);
                        }.bind(args)
                    });

                let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");


                const deleteButton = document.getElementById("sidebar-delete-button");
                if (deleteButton) {
                    deleteButton.addEventListener("click", () => {
                        if (onDelete && posting) {
                            onDelete(posting.id);
                        }
                    });
                }

                $(sidebar).find("input").each((index, el) => {
                    el.addEventListener("input", function(e){
                        hasChanges = true;
                        confirmButton.enable(!corrupted);
                    })
                })
            }


        }

        catch (error) {
            const errMsg = "Huch, hier ist etwas schief gelaufen."
            const handlerError = new HandlerFunctionError(errMsg);
            console.error("Error loading showPostingDetails template:", error);
            sidebar.addErrorMessage(errMsg, (errorHTML: HTMLElement) => {
                $("#sidebar-inner").before(errorHTML);
            }, false, true);
            handlerFunctionResult.addError(handlerError)
        }

        return handlerFunctionResult;
    }
);

eventFactoryPlugin.addContentHandler(showUpdateEventDateContent);
eventFactoryPlugin.addContentHandler(showUpdateEventLocationContent);
eventFactoryPlugin.addContentHandler(showPostings);
eventFactoryPlugin.addContentHandler(addPosting);
eventFactoryPlugin.addContentHandler(showPostingDetails);

export default eventFactoryPlugin;

export interface AddPostingOnConfirmPayload {
    qualifications: number[],
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
}

export interface AddPostingOnConfirmArgs {
    startTime: string
    endTime: string
}

export interface ShowPostingConfirmPayload {
    id: string|number,
    description: string,
    allowHigher: boolean,
    optional: boolean,
    enabled: boolean,
}