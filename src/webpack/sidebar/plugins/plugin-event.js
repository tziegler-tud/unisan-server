import {Sidebar, SidebarPlugin, ContentHandler, SidebarButton} from "../sidebar.js";
import {Searchbar} from "../../searchbar/searchbar.js";
import {MDCList} from '@material/list';


const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";
import {getDataFromServer} from "../../helpers/helpers";

let eventPlugin = new SidebarPlugin("event");

let showEventParticipants = new ContentHandler("eventParticipants",
    function(sidebar, args, type){
        var event = args.event;
        //populate
        $.get('/webpack/sidebar/templates/events/sidebar-eventParticipants.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(event));
            sidebar.registerBackButton( ".sidebar-back-btn");
            // find if current user is registered for event
            let notRegistered = $("#sidebar-participate-button-notregistered");
            let registered = $("#sidebar-participate-button-registered");
            let target;
            if (args.isParticipant) {
                notRegistered.addClass("hidden");
                registered.removeClass("hidden");
                registered.on("change", function (e) {
                    if (e.target.value === "remove") {
                        args.callback.onDelete();
                    }
                })
            } else {
                sidebar.registerButton(notRegistered, function () {
                    args.callback.onConfirm();
                });
            }
        });
    });

let addEventParticipant = new ContentHandler("addEventParticipant",
    function(sidebar, args, type){
        var event = args.event;
        var filteredList = args.select
        var onConfirm = args.callback.onConfirm;
        var selectedUser = {role: "participant"};

        //populate
        $.get('/webpack/sidebar/templates/events/sidebar-eventParticipantsAdd.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(event));
            let backBtn = sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");
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
            let searchContainer = document.getElementById("search-container")
            let searchbarContainer = document.getElementById("usersearch");
            var searchbar = new Searchbar(searchbarContainer, {
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
                            var template = Handlebars.compile(data);
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


let showUpdateEventDateContent = new ContentHandler("editEventDate",
    function(sidebar, args, type){
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        let context = {};
        context.event = args.event;
        var corrupted = false;

        $.get('/webpack/sidebar/templates/events/sidebar-updateEventDate.hbs', function (data) {

            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));

            let currentStartDate = new Date(context.event.date.startDate);
            let currentEndDate = new Date(context.event.date.endDate);
            if (isNaN(currentStartDate.getFullYear()) || isNaN(currentEndDate.getFullYear())) {
                currentStartDate = new Date();
                currentEndDate = new Date();
                var corrupted = true;
                console.warn("trying to read corrupted data");
                sidebar.addErrorMessage("Failed to read event date from database. Please set a new date.",  function(data){
                    $("#sidebar-inner").before(data);
                }, false, true);
            }

            var d1 = document.getElementById("eventinp-date");
            var t1 = document.getElementById("eventinp-timeStart");
            // var d2 = document.getElementById("endDate-input");
            var t2 = document.getElementById("eventinp-timeEnd");
            var l = document.getElementById("eventinp-location");

            $(d1).val(currentStartDate.toDateInputValue())
            $(t1).val(currentStartDate.toTimeInputValue())
            $(t2).val(currentEndDate.toTimeInputValue())

            sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm", function(){
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
            }.bind(args));
        })
    })


let showUpdateEventLocationContent = new ContentHandler("editEventLocation",
    function(sidebar, args, type){
        var onConfirm = args.callback.onConfirm;

        let context = {};
        context.event = args.event;
        var corrupted = false;

        $.get('/webpack/sidebar/templates/events/sidebar-updateEventLocation.hbs', function (data) {

            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));

            let location = context.event.location;
            if (location === undefined) {
                location = "";
                var corrupted = true;
                console.warn("trying to read corrupted data");
                sidebar.addErrorMessage("Failed to read event location from database.",  function(data){
                    $("#sidebar-inner").before(data);
                }, false, true);
            }
            var l = document.getElementById("eventinp-location");

            sidebar.registerBackButton(".sidebar-back-btn");
            let cancelBtn = sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton(".sidebar-confirm", function(){
                let location = $(l).val();

                let data = {
                    location: location,
                }
                onConfirm(args.event, data, {});
            }.bind(args));
        })
    })

eventPlugin.addContentHandler(showEventParticipants);
eventPlugin.addContentHandler(addEventParticipant);
eventPlugin.addContentHandler(showUpdateEventDateContent);
eventPlugin.addContentHandler(showUpdateEventLocationContent);

//TODO: make Sidebar a singleton and add static function to access runtime object

export {eventPlugin}