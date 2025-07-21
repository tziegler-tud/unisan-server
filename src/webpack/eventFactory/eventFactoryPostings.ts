import "./eventParticipants.scss";
import { UserProfile } from "../userprofile/userprofile";
import { DropdownMenu } from "../helpers/dropdownMenu";
import Snackbar from "../helpers/snackbar";
import "../helpers/handlebarsHelpers";
import PageModule from "../utils/PageModule";
import Sidebar from "../sidebar/Sidebar";

import {Observer as lidlObserver} from "../../lib/lidl-modules/observer/lidl-observer.js";
import {Dialog as lidlDialog} from "../../lib/lidl-modules/dialog/lidl-dialog.js";

import eventFactoryPlugin, {
    AddPostingOnConfirmPayload, ShowPostingConfirmPayload
} from "../sidebar/plugins/plugin-eventfactory";

import EventBlueprintProfile from "./EventBlueprintProfile";

import {type IEventBlueprint, IBlueprintPosting} from "../types/EventBlueprint"
import eventBlueprintActions from "../actions/eventBlueprintActions";
import EditableInputField from "../helpers/EditableInputField";
import {phone, tablet} from "../helpers/variables";
import EventBlueprintPage from "./EventBlueprintPage";
import Searchbar from "../widgets/searchbar/SearchBar";
import { IParticipant } from "../types/Event";
import ScrollableList, {ScrollableListArgs} from "../scrollableList/ScrollableList";

import {IUser} from "../types/User";
import {Corner} from "@material/menu";


interface PageData {
    user?: any; // Replace 'any' with the actual type of user data
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


export default new PageModule ({
    title: "eventFactory.postings",
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

        let event: IEventBlueprint = await eventProfile.getEvent()
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

        const user = data.user;
        const event = data.event;
        const eventProfile = this.pageData.eventProfile;
        this.pageData.event = event;
        this.pageData.user = user;

        let self = this;
        let dataList: IBlueprintPosting[] = []

        self.view = "cards";
        self.scrollableList;

        let checked= $('input[name=eventlist-radio]:checked');
        let listRadio = $("#eventlist01");
        let cardsRadio = $("#eventlist02");
        listRadio.on("change", function(){
            if (self.view === "cards") {
                self.view = "list";
                self.scrollableList.setView("list")
            }
        });
        cardsRadio.on("change", function(){
            if (self.view === "list") {
                self.view = "cards";
                self.scrollableList.setView("cards")
            }
        })
        //try to recreate checked state across page reloads
        if (checked.val()){
            self.view = checked.val();
        }

        // window.DockerElement = new docker.Docker(window.dockerArgs);
        //@ts-ignore
        window.DockerElement.addDockerSubPage("eventBlueprint", self.pageData.event, {}, undefined, {currentEvent: {edit: args.allowEdit, type: self.pageData.event.type.index}});

        var sidebar = new Sidebar('wrapper');
        sidebar.addPlugin(eventFactoryPlugin);

        const snackbar = new Snackbar()

        // init event sidebar
        await sidebar.addContent("eventBlueprintDetails", {
            event: self.pageData.event,
            user: self.pageData.user,
            callback: {
            },
        });
        if(!(phone.matches || tablet.matches)) sidebar.show();
        sidebar.setCurrentDefault();

        let pageContainer = document.getElementById("eventPage-component-container");
        var eventPage = new EventBlueprintPage({
            container: pageContainer,
            sidebar: sidebar,
            data: {user: user, event: event},
            args: {},
        });

        let titleInputContainer = document.getElementById("eventtitle-input");
        let editableInputField = new EditableInputField(titleInputContainer,self.pageData.event.title.delta, "text", {}, {readOnly: true});

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});
        const deleteContent = {
            title: "Event löschen",
            message: "Dieser Vorgang kann nicht rückgängig gemacht werden. Fortfahren?",
            titleArg: "",
            messageArg: ""
        };

        var deleteArgs = {
            eventid:self.pageData.event.id,
            callback: {
                onConfirm: function () {
                    eventBlueprintActions.deleteEventBlueprint(event.id)
                }
            }
        };

        // @ts-ignore
        var token = window.lidlRTO.objectManager.createNewObjectToken();
        const dialogDeleteEvent = new lidlDialog(token, ".eventDelete", 'confirmDelete', deleteContent, deleteArgs, {});
        // @ts-ignore
        window.lidlRTO.objectManager.addObject(dialogDeleteEvent, token);

        //setup searchbar
        let searchbar = document.getElementById("usersearch-participants");
        self.searchbar = new Searchbar(searchbar, {
            onInput: {
                enabled: true,
                callback: function(inputValue){
                    let filteredList = [];
                    if(!inputValue) filteredList = dataList;
                    else {
                        filteredList = filterPostingsList(dataList, inputValue);
                    }
                    displayPostingsList(filteredList);

                },
            },
        });

        function filterPostingsList(postingsList: IBlueprintPosting[], inputValue: string) {
            return postingsList.filter(function(posting){
                return posting.requiredQualifications.some(qual => {
                    return qual.name.includes(inputValue) || qual.short.includes(inputValue)
                })
            })
        }

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

        function buildTrainingPage(){
            var rolesMap = {
                "participant": 0,
                "lecturer": 1,
                "admin": 2,
            }

            self.view = "list";

        }

        function buildSeminarPage() {
            //qualTypes to be enabled for new postings: (empty array to include all)
            let qualTypes = [qualTypesMap.AUSBILDUNG, qualTypesMap.NACHWEIS];

            //display all users initially
            dataList =self.pageData.event.postings;
            self.scrollableList = displayPostingsList(dataList);


            document.querySelectorAll(".add-participant-button").forEach((element) => {
                element.addEventListener("click", (e) => {
                    e.preventDefault();
                    sidebar.addContent("addEventBlueprintPosting", {
                        event: self.pageData.event,
                        user: self.pageData.user,
                        qualTypes: qualTypes,
                        callback: {
                            onConfirm: (data: AddPostingOnConfirmPayload, args: {}) =>{
                                let posting = {
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
                                eventBlueprintActions.addPosting(event.id, posting, (event) =>{
                                    eventProfile.refreshEvent()
                                        .then((eventBlueprint: IEventBlueprint) => {
                                            self.pageData.event = event;
                                            sidebar.update({event: event, isParticipant: false});
                                            self.dataList =self.pageData.event.postings;
                                            displayPostingsList(self.dataList);
                                            self.searchbar.hide();
                                        })
                                        .catch((err: Error) => {
                                        })
                                }, args).fail((jqxhr, textstatus, error) => snackbar.showError(jqxhr, textstatus));
                            },
                        },
                    });
                    sidebar.show();
                })
            })
        }

        function buildSanPage() {
            //qualTypes to be enabled for new postings: (empty array to include all)
            let qualTypes = [qualTypesMap.SAN, qualTypesMap.FUEHRUNG];

            //display all users initially
            dataList =self.pageData.event.postings;
            self.scrollableList = displayPostingsList(self.dataList);

            document.querySelectorAll(".add-participant-button").forEach((element) => {
                element.addEventListener("click", (e) => {
                    e.preventDefault();
                    sidebar.addContent("addEventBlueprintPosting", {
                        event: self.pageData.event,
                        user: user,
                        qualTypes: qualTypes,
                        callback: {
                            onConfirm: function(data: AddPostingOnConfirmPayload, args: {}){
                                let posting = {
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
                                eventBlueprintActions.addPosting(event.id, posting, (event)=> {
                                    eventProfile.refreshEvent()
                                        .then((event: IEventBlueprint) => {
                                            self.pageData.event = event;
                                            sidebar.update({event: event});
                                            self.dataList =self.pageData.event.postings;
                                            displayPostingsList(self.dataList);
                                            self.searchbar.hide();
                                        })
                                        .catch((err: Error) => {
                                        })
                                }, {}).fail((jqXHR: JQuery.jqXHR,  textStatus: string,  errorThrown: string) => snackbar.showError(jqXHR, textStatus));
                            },
                        },
                    });
                    sidebar.show();
                })
            });
        }

        function displayPostingsList(dataList: IBlueprintPosting[]) {

            let sortedList = dataList;
            // self.dataList = sortedList;

            let dropdownMenus = function(){
                $('.participant-menu-container').each(function(){
                    let trigger = $(this).find(".participant-menu-button").first().get(0);
                    let m = new DropdownMenu(this, "click", trigger, {anchorCorner: Corner.BOTTOM_LEFT, fixed: true})
                });
            }
            let deletePost = function(){
                $('.posting-delete').each(function(){
                    $(this).on("click", function(e){
                        //push changes to server
                        e.preventDefault();
                        e.stopPropagation();
                        let postingId = e.currentTarget.dataset.postingid;
                        deletePosting(self.pageData.event, postingId);
                    })
                });
            }

            let postDetails = function(){
                $('.posting-details, .posting-edit').each(function(){
                    $(this).on("click", function(e){
                        e.preventDefault();
                        let element = e.currentTarget;
                        let postingId = element.dataset.postingid;
                        showDetailsSidebar(postingId, element);
                    })
                });
            }


            let scrollArgs: ScrollableListArgs = {
                height: "full",
                enableMobile: true,
                view: self.view,
                // fixedHeight: "500px",
                sorting: {
                    property: "role",
                    direction: 1,
                },
            }
            let callback = {
                listItem: {
                    onClick:  (e: Event)=> {
                        let element = e.currentTarget as HTMLElement;
                        e.preventDefault();
                        //find posting in augmented list
                        //@ts-ignore
                        let postingId = element.dataset.postingid;
                        showDetailsSidebar(postingId, element)
                    }
                },
                customHandlers: [deletePost, dropdownMenus, postDetails]
            }



            let listContainer = document.getElementById("userlist-container--participants")
            let scrollableList = new ScrollableList(listContainer, "factoryPostings", sortedList, scrollArgs, callback)

            return scrollableList;

            function showDetailsSidebar(postingId: string, element: HTMLElement) {
                let augmentedPosting = sortedList.find(e => e._id.toString() === postingId);

                sidebar.addContent("showBlueprintPostingDetails", {
                    postingId: postingId,
                    augmentedPosting: augmentedPosting,
                    event: self.pageData.event,
                    allowEdit: args.allowEdit,
                    user: self.pageData.user,
                    userIsAllowed: element.dataset.userisallowed,
                    callback: {
                        onConfirm: function(data: ShowPostingConfirmPayload, localArgs: {}){
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

                            eventBlueprintActions.updatePosting(event.id, posting, {
                                onSuccess: ()=>{
                                    eventProfile.refreshEvent()
                                        .then((event: IEventBlueprint) => {
                                            self.pageData.event = event;
                                            self.dataList =self.pageData.event.postings;
                                            displayPostingsList(self.dataList);
                                            self.searchbar.hide();
                                            let newPosting = event.postings.find(posting => posting._id.toString() === postingId);
                                            let newAugmentedPosting = Object.assign(augmentedPosting, newPosting)
                                            sidebar.update({event: event, augmentedPosting: newAugmentedPosting});
                                            snackbar.show("Änderungen erfolgreich gespeichert.")

                                        })
                                        .catch((err: Error) => {

                                        })
                                },
                                onError:  (jqxhr, textstatus, error) => {
                                    snackbar.showError(jqxhr, textstatus)
                                }
                            })
                        },
                        onDelete: function(data: {id: number}){
                            let postingId = data.id.toString();
                            //push changes to server
                            deletePosting(self.pageData.event, postingId)
                        }
                    }
                });
                sidebar.show();
            }

            function deletePosting(event: IEventBlueprint, postingId: string){
                eventBlueprintActions.removePosting(event.id, postingId, {
                    onSuccess: ()=>{
                    eventProfile.refreshEvent()
                        .then((event: IEventBlueprint) => {
                            self.pageData.event = event;
                            self.dataList = event.postings;
                            displayPostingsList(self.dataList);
                            self.searchbar.hide();
                            sidebar.showDefault();
                            snackbar.show("Posten erfolgreich gespeichert.")
                        })
                        .catch((err: Error) => {
                        })
                }
            }).fail((jqxhr, textstatus, error) => {
                snackbar.showError(jqxhr, textstatus)
                });
            }
        }

    },
    updatePage: async function (vals: {data: {user: IUser, event: IEventBlueprint}, args: Object}) {
        return this.buildPage({args: vals.args, data: vals.data})
    }
});

let qualTypesMap = {
    SAN: "Sanitätsdienst",
    FUEHRUNG: "Einsatzführung",
    NACHWEIS: "Nachweis",
    AUSBILDUNG: "Ausbildung",
}