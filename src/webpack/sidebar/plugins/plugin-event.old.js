/**
 * typedef Posting
 * @typedef {Object} Posting
 * @property {Qualification[]} requiredQualifications - array of required qualifications
 * @property {Object} date - complex object wrapping date information
 * @property {Date} date.startDate - start date
 * @property {Date} date.endDate - end date
 * @property {Number} order - order of posting, for displaying purposes
 * @property {boolean} enabled - true if the posting is enabled. Currently not used.
 * @property {boolean} optional - true if the posting is optional. Currently not used.
 * @property {Object} assigned - complex object containing information on assigned user
 * @property {boolean} isAssigned - true if the posting has an user assigned.
 * @property {User} isAssigned - the assigned user.
 * @property {Qualification} qualification - information on the qualification used for assignement.
 * @property {Date} date - date this user was assigned
 *
 */

import "../sidebar-events.scss";
import "../sidebar-addParticipant.scss";

import SidebarPlugin from "../SidebarPlugin"
import ContentHandler from "../ContentHandler";
import SidebarButton from "../SidebarButton";
import SidebarTooltip from "../SidebarTooltip";

import Searchbar from "../../widgets/searchbar/SearchBar";

const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";
import {getMatchingQualifications} from "../../helpers/helpers";
import EditableInputField from "../../helpers/EditableInputField";
import {EditableTextField} from "../../helpers/editableTextField";


let eventPlugin = new SidebarPlugin("event");


let viewEvent = new ContentHandler("viewEvent",
    async function(sidebar, args, type){
        let event = args.event;
        let context = {
            event: event,
            args: args,
        }

        $.get('/webpack/sidebar/templates/events/sidebar-viewEvent.hbs', function (data) {
            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton( ".sidebar-back-btn");

            let titleInputContainer = document.getElementById("sidebar-eventDetails--titleRenderer");
            new EditableInputField(titleInputContainer, event.title.delta, "text", {}, {readOnly: true});

            let descContainer = document.getElementById("sidebar-eventDetails--descRenderer");
            new EditableTextField(descContainer, event.description.longDesc.delta, event.description.longDesc.html, {}, {readOnly: true});

            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        window.location.href= "/events/"+event.id;
                    }.bind(args)
                });

        });
    });


let eventDetails = new ContentHandler("eventDetails",
    async function(sidebar, args, type){
        let event = args.event;
        let context = {
            event: event,
            args: args,
        }
        $.get('/webpack/sidebar/templates/events/sidebar-eventDetails.hbs', function (data) {
            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton( ".sidebar-back-btn");

            let titleInputContainer = document.getElementById("sidebar-eventDetails--titleRenderer");
            new EditableInputField(titleInputContainer, event.title.delta, "text", {}, {readOnly: true});

            let descContainer = document.getElementById("sidebar-eventDetails--descRenderer");
            new EditableTextField(descContainer, event.description.longDesc.delta, event.description.longDesc.html, {}, {readOnly: true});

        });
    });

let showEventParticipants = new ContentHandler("eventParticipants",
    async function(sidebar, args, type){
        let event = args.event;
        let context = {
            event: event,
            args: args,
        }
        //populate
        $.get('/webpack/sidebar/templates/events/sidebar-eventParticipants.hbs', function (data) {
            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
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
                    if (e.target.value === "remove") {
                        args.callback.onDelete();
                    }
                })
            } else {
                sidebar.registerButton(notRegisteredSelector,
                    {
                        customHandler: true,
                        handler: function () {
                            args.callback.onConfirm();
                        }
                    });
            }
        });
    });

let addEventParticipant = new ContentHandler("addEventParticipant",
    async function(sidebar, args, type){
        let event = args.event;
        let onConfirm = args.callback.onConfirm;
        let selectedUser = {role: "participant"};

        //populate
        $.get('/webpack/sidebar/templates/events/sidebar-eventParticipantsAdd.hbs', function (data) {
            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(event));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            let confirmButton = new SidebarButton({
                sidebar: sidebar,
                selector: ".sidebar-confirm",
                type: "confirm",
                enabled: false,
                handler: function(){
                    data = {
                        userid:  selectedUser.id,
                        role:  selectedUser.role,
                    };
                    onConfirm(data);
                }.bind(args)
            });
            // displayUserList()

            //setup searchbar
            let searchbarContainer = document.getElementById("usersearch");
            let searchbar = new Searchbar(searchbarContainer, {
                hidden: false,
                label: "Suche:",
                noIcon: true,
                enableCollapse: false,
                onInput: {
                    enabled: true,
                    callback: function(inputValue){
                        displayUserList(inputValue)
                    },
                },
                onFocus: {
                    enabled: true,
                    callback: function(inputValue){
                        displayUserList(inputValue)
                    }
                },
            });


            //hook user query to input element
            function displayUserList(filter) {

                let handleData = {};
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
                    success: function(result) {
                        handleData.userlist = result;
                        // render userlist template
                        $.get('/webpack/sidebar/plugins/userselect-plugin.hbs', function (data) {
                            let template = Handlebars.compile(data);
                            appendContent(template(handleData))
                        });
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert("some error");
                    }
                });

                function appendContent(html) {
                    //append to subpage container #userlist-container
                    let container = document.getElementById('sidebar-userselect-container');
                    container.innerHTML = html;
                    // const list = new MDCList(document.getElementById("addParticipantList"));

                    //click on user selects it
                    let items = $(".participant-item-selectable");
                    items.on("mousedown", function(e) {
                        e.preventDefault(); //preventDefault to stop blur event before click is fired
                    })
                    items.each(function(){
                        this.addEventListener("click", function(){
                            let userid = this.dataset.userid;
                            //hide searchbar, display user item instead
                            let userentry = this.cloneNode(true);
                            userentry.classList.remove("participant-item-selectable");
                            searchbar.hide();
                            container.classList.add("hidden");
                            let resultContainer = document.getElementById("sidebar-userselect-result");

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
                        if(searchbar.isActive()) {
                            container.classList.add("hidden");
                        }
                    });
                    $(searchbar.getInputElement()).focus(function(){
                        //dont show when searchbar is disabled
                        if(searchbar.isActive()){
                            container.classList.remove("hidden");
                        }
                    })
                }
            }
        });
    })

let assignUserSubpage = new ContentHandler("assignUserSubpage",
    async function(sidebar, args, type){
        let event = args.event;
        let postingId = args.postingId;
        let onConfirm = args.callback.onConfirm;
        let onCancel = args.callback.onCancel;
        let selectedUser = {};

        //populate
        $.get('/webpack/sidebar/templates/events/assignUserSubpage.hbs', function (data) {
            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(event));
            let backBtn = sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel", {
                customHandler: true,
                handler: onCancel,
            });
            let confirmButton = new SidebarButton({
                sidebar: sidebar,
                selector: ".sidebar-confirm",
                type: "confirm",
                enabled: false,
                handler: function(){
                    data = {
                        userid:  selectedUser.id,
                        check: selectedUser.check,
                    };
                    onConfirm(data);
                }.bind(args)
            });
            // displayUserList()

            //setup searchbar
            let searchbarContainer = document.getElementById("usersearch");
            let searchbar = new Searchbar(searchbarContainer, {
                hidden: false,
                label: "Suche:",
                noIcon: true,
                enableCollapse: false,
                onInput: {
                    enabled: true,
                    callback: function(inputValue){
                        displayUserList(inputValue)
                    },
                },
                onFocus: {
                    enabled: true,
                    callback: function(inputValue){
                        displayUserList(inputValue)
                    }
                },
            });


            //hook user query to input element
            function displayUserList(filter) {

                let handleData = {};
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
                    success: function(result) {
                        handleData.userlist = result;
                        // render userlist template
                        $.get('/webpack/sidebar/plugins/userselect-plugin.hbs', function (data) {
                            let template = Handlebars.compile(data);
                            appendContent(template(handleData))
                        });
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert("some error");
                    }
                });

                function appendContent(html) {
                    //append to subpage container #userlist-container
                    let container = document.getElementById('sidebar-userselect-container');
                    container.innerHTML = html;
                    // const list = new MDCList(document.getElementById("addParticipantList"));

                    //click on user selects it
                    let items = $(".participant-item-selectable");
                    items.on("mousedown", function(e) {
                        e.preventDefault(); //preventDefault to stop blur event before click is fired
                    })
                    items.each(function(){
                        this.addEventListener("click", function(){
                            let userid = this.dataset.userid;
                            //hide searchbar, display user item instead
                            let userentry = this.cloneNode(true);
                            userentry.classList.remove("participant-item-selectable");
                            userentry.classList.add("userentry-result");
                            searchbar.hide();
                            container.classList.add("hidden");
                            let resultContainer = document.getElementById("sidebar-userselect-result");

                            //create cancel btn
                            let cancelBtn = document.createElement("div");
                            cancelBtn.classList.add("before-icon",  "icon-cancel");
                            cancelBtn.addEventListener("click", function(){
                                //reset sidebar
                                sidebar.resetCurrentPage();
                            })
                            userentry.append(cancelBtn);

                            let checkPanel = document.getElementById("label-spinner");
                            checkPanel.classList.add("label-active");

                            let c = document.createElement("div");
                            c.className = "event-participants";
                            c.append(userentry);
                            resultContainer.append(c);
                            selectedUser.id = userid;

                            checkUser(userid, event.id, postingId)
                                .then(result => {
                                    selectedUser.check = result;
                                    if(result.allowed) {
                                        confirmButton.enable();
                                        //display allow info panel
                                        checkPanel.classList.remove("label-active");
                                        let allowedPanel = document.getElementById("label-isAllowed");
                                        allowedPanel.classList.add("label-active");
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
                                        checkPanel.classList.remove("label-active");
                                        let allowedPanel = document.getElementById("label-notAllowed");
                                        allowedPanel.classList.add("label-active");
                                        let textContent = document.getElementById("label-notAllowed-content--text");
                                        textContent.innerHTML = reason;
                                    }

                                })
                                .catch(err => {throw new Error(err)})

                        });
                    })

                    // click outside should hide popup
                    $(searchbar.getInputElement()).blur(function(){
                        if(searchbar.isActive()) {
                            container.classList.add("hidden");
                        }
                    });
                    $(searchbar.getInputElement()).focus(function(){
                        //dont show when searchbar is disabled
                        if(searchbar.isActive()){
                            container.classList.remove("hidden");
                        }
                    })
                }

                function checkUser(userId, eventId, postingId){
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
                            success: function(result) {
                                resolve(result)
                            },
                            error: function(XMLHttpRequest, textStatus, errorThrown) {
                                reject(XMLHttpRequest, textStatus, errorThrown)
                            }
                        });
                    })
                }
            }
        });
    })


let showUpdateEventDateContent = new ContentHandler("editEventDate",
    async function(sidebar, args, type){
        let onConfirm = args.callback.onConfirm;
        let onDelete = args.callback.onDelete;

        let context = {
            userAgent: {
                locale: Intl.DateTimeFormat().resolvedOptions()
            },
        };
        context.event = args.event;

        $.get('/webpack/sidebar/templates/events/sidebar-updateEventDate.hbs', function (data) {

            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));

            let currentStartDate = new Date(context.event.date.startDate);
            let currentEndDate = new Date(context.event.date.endDate);
            if (isNaN(currentStartDate.getFullYear()) || isNaN(currentEndDate.getFullYear())) {
                currentStartDate = new Date();
                currentEndDate = new Date();
                console.warn("trying to read corrupted data");
                sidebar.addErrorMessage("Failed to read event date from database. Please set a new date.",  function(data){
                    $("#sidebar-inner").before(data);
                }, false, true);
            }

            let d1 = document.getElementById("eventinp-date");
            let t1 = document.getElementById("eventinp-timeStart");
            // let d2 = document.getElementById("endDate-input");
            let t2 = document.getElementById("eventinp-timeEnd");
            let l = document.getElementById("eventinp-location");

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
                        onConfirm(args.event, data, {});
                    }.bind(args)
                });
        })
    })


let showUpdateEventLocationContent = new ContentHandler("editEventLocation",
    async function(sidebar, args, type){
        let onConfirm = args.callback.onConfirm;

        let context = {};
        context.event = args.event;
        $.get('/webpack/sidebar/templates/events/sidebar-updateEventLocation.hbs', function (data) {

            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));

            let location = context.event.location;
            if (location === undefined) {
                console.warn("trying to read corrupted data");
                sidebar.addErrorMessage("Failed to read event location from database.",  function(data){
                    $("#sidebar-inner").before(data);
                }, false, true);
            }
            let l = document.getElementById("eventinp-location");

            sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        let location = $(l).val();

                        let data = {
                            location: location,
                        }
                        onConfirm(args.event, data, {});
                    }.bind(args)
                });
        })
    })

let showPostings = new ContentHandler("eventPostings",
    async function(sidebar, args, type){
        let onConfirm = args.callback.onConfirm;

        let context = {};
        context.event = args.event;

        $.get('/webpack/sidebar/templates/events/sidebar-eventPostings.hbs', function (data) {

            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));

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
                            args.callback.onConfirm();
                        }
                    });
            }

        })
    })

let addPosting = new ContentHandler("addEventPosting",
    async function(sidebar, args, type){
        let onConfirm = args.callback.onConfirm;

        let context = {};
        context.event = args.event;
        context.title = "Dienstposten erstellen";
        context.args = args;

        let res = {qualifications: {}}

        sidebar.getDataFromServer("/api/v1/qualification/groupByType", function(context){

            //filter for appropriate types
            let qualTypeFilters = args.qualTypes;
            if (!(qualTypeFilters === undefined || qualTypeFilters === null || !Array.isArray(qualTypeFilters) || qualTypeFilters.length === 0)) {
                context = context.filter(qualGroup => {return qualTypeFilters.includes(qualGroup._id)})
            }
            res.qualifications.byType = context;
            action(res)
        })

        function action(res){
            $.get('/webpack/sidebar/templates/events/sidebar-addEventPosting.hbs', function (tdata) {

                context.qualifications = res.qualifications;
                let template = Handlebars.compile(tdata);
                sidebar.sidebarHTML.html(template(context));

                sidebar.registerBackButton(".sidebar-back-btn");
                let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");
                sidebar.registerConfirmButton( ".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            const optional = document.getElementById("isOptional-checkbox").checked;
                            const enabled = true;
                            const allowHigher = document.getElementById("allowHigher-checkbox").checked;
                            const id = document.getElementById("qual-name").selectedOptions[0].id;
                            const t1 = document.getElementById("eventinp-timeStart");
                            const t2 = document.getElementById("eventinp-timeEnd");
                            const data = {
                                qualifications: [id], //array of quals
                                description: $("#posting-description").val(), //string
                                allowHigher: allowHigher,
                                optional: optional,
                                enabled: enabled,
                            };
                            const args = {
                                date: context.event.date.startDate,
                                startTime: t1.value,
                                endTime: t2.value,
                            }
                            onConfirm(data, args);
                        }.bind(args)
                    });

                let levelObject = document.getElementById("qual-level");
                let q = $("#qual-type");
                q.on("change",function(e){
                    let typeData = res.qualifications.byType.find(element => element._id === e.target.value);
                    let qualNameObject = document.getElementById("qual-name");
                    // remove existing options
                    qualNameObject.options.length = 0;
                    //add available options for selected type
                    typeData.values.forEach(function (el, index){
                        const option = document.createElement('option');
                        option.id = el._id;
                        option.dataset.qualid = el._id;
                        option.value = el.name;
                        option.innerHTML = el.name;
                        qualNameObject.options[index] = option;
                    });
                })
                let n = $("#qual-name");
                n.on("change",function(e){
                    let qual = sidebar.findQualByIdInTypeArray(res.qualifications.byType, e.target.selectedOptions[0].dataset.qualid)
                    levelObject.value = qual.level;
                })
                n.trigger("change");
            })
        }
    })

let showPostingDetails = new ContentHandler("showPostingDetails",
    async function(sidebar, args, type){
        let onDelete = args.callback.onDelete;
        let onConfirm = args.callback.onConfirm;
        let onAssign = args.callback.onAssign;
        let onUnassign = args.callback.onUnassign;

        let context = {};
        if(args.allowEdit === undefined) args.allowEdit = {};
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

        context.sidebar = {title: (args.allowEdit ? "Dienstposten bearbeiten" : "Details: Dienstposten")};

        let posting = context.augmentedPosting;
        if (context.augmentedPosting === undefined) {
            //find posting
            posting = context.event.postings.find(el => {
                return el._id.toString() === context.postingId;
            })
            if(posting === undefined) {
                posting = {
                    requiredQualifications: [],
                };
                corrupted = true;
            }
        }

        if (posting.assigned.isAssigned) {
            context.assignedUser = posting.assigned.user;
            //check if self is assigned
            if (posting.assigned.user.id.toString() === context.user.id.toString()) {
                context.isAssignedToSelf = true;
            }
        }


        context.posting = posting;

        let matchingQualifications = getMatchingQualifications(user, posting);
        context.userIsAllowed = (matchingQualifications.length > 0);





        $.get('/webpack/sidebar/templates/events/sidebar-showPostingDetails.hbs', function (data) {

            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
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
            let t1;
            let t2;
            if(args.allowEdit){
                let currentStartDate = new Date(posting.date.startDate);
                let currentEndDate = new Date(posting.date.endDate);
                if (isNaN(currentStartDate.getFullYear()) || isNaN(currentEndDate.getFullYear())) {
                    currentStartDate = new Date();
                    currentEndDate = new Date();
                    corrupted = true;
                }
                else {
                    t1 = document.getElementById("eventinp-timeStart");
                    t2 = document.getElementById("eventinp-timeEnd");
                    $(t1).val(currentStartDate.toTimeInputValue())
                    $(t2).val(currentEndDate.toTimeInputValue())
                }

                if(!posting.assigned.isAssigned) {

                }
            }

            if(corrupted) {
                sidebar.addErrorMessage("Corrupted data detected: Failed to find selected posting.", function(html){
                    //find .sidebar-inner
                    document.getElementById("sidebar-inner").prepend(html);
                })
                return false;
            }

            sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");

            if(posting.assigned.isAssigned){
                if (args.allowEdit || context.isAssignedToSelf) {
                    let unassignButton = sidebar.registerButton(".sidebar-unassign",
                        {
                            type: "delete",
                            customHandler: true,
                            handler: function(){
                                let data = {
                                    event: context.event,
                                    userId: context.assignedUser.id.toString(),
                                    postingId: context.postingId
                                }
                                onUnassign(data);
                            },
                            enabled: true,
                        }
                    )
                }

            }
            else {
                let assignSelfButton = sidebar.registerButton(".sidebar-assignSelf",
                    {
                        type: "allowed",
                        customHandler: true,
                        handler: function(){
                            let data = {
                                event: context.event,
                                userId: context.user.id,
                                postingId: context.postingId
                            }
                            onAssign(data);
                        },
                    }
                )
                let assignButton = sidebar.registerButton(".sidebar-assign",
                    {
                        type: "custom",
                        customHandler: true,
                        handler: function(){
                            //save current sidebar content
                            let currentContent = sidebar.saveContent();
                            //show assign user sidebar
                            sidebar.addContent("assignUserSubpage", {
                                event: context.event,
                                postingId: context.postingId,
                                callback: {
                                    onConfirm: function(result){
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
                                        onAssign(data);
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

            args.date = posting.date.startDate;

            let confirmButton = sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    enabled: (context.allowEdit && !corrupted && hasChanges),
                    handler: function () {
                        const optional = document.getElementById("isOptional-checkbox").checked;
                        const enabled = true;
                        const allowHigher = document.getElementById("allowHigher-checkbox").checked;
                        const data = {
                            id: context.postingId,
                            description: $("#posting-description").val(), //string
                            optional: optional,
                            enabled: enabled,
                            allowHigher: allowHigher,
                        };
                        const args = {
                            date: context.event.date.startDate,
                            startTime: t1.value,
                            endTime: t2.value,
                        }
                        onConfirm(data, args);
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
                        onDelete(data);
                    },
                });

            $(sidebar.sidebarHTML).find("input").each((index, el) => {
                el.addEventListener("input", function(e){
                    hasChanges = true;
                    confirmButton.enable(context.allowEdit && !corrupted);
                })
            })
        })
    },
    {})


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

//TODO: make Sidebar a singleton and add static function to access runtime object

export {eventPlugin}