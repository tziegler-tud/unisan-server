import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar.js";

const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";
import {getDataFromServer} from "../../helpers/helpers";

let rolesPlugin = new SidebarPlugin("roles");

let showRole = new ContentHandler("user",
    function(sidebar, args, type) {
        var userid = args.userid;
        getDataFromServer("/api/v1/usermod/"+userid,function(context){
            $.get('/webpack/sidebar/templates/sidebar-user.hbs', function (data) {
                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(sidebar,".sidebar-back-btn");
            });
        })
    });
let addGroup = new ContentHandler("addGroup",
    function(sidebar, args, type) {
        var context = {};
        var onConfirm = args.callback.onConfirm;
        $.get('/webpack/sidebar/templates/roles/sidebar-addGroup.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(sidebar,".sidebar-back-btn");
            sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                let data = {
                    title: $("#addRoleForm-title").val(),
                    description: $("#addRoleForm-description").val(),
                };
                onConfirm(data);
            }.bind(args));

        });
    
    });

let changeGroup = new ContentHandler("changeGroup",
    function(sidebar, args, type) {
        var groupId = args.groupId;
        var onConfirm = args.callback.onConfirm;
        var corrupted = false;

        var res = {};

        getDataFromServer("/api/v1/groups/"+ groupId,function(context){
            res.group = context;
            res.groupId = groupId;
            action(res)
        });

        var action = function(context) {
            $.get('/webpack/sidebar/templates/roles/sidebar-changeGroup.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                    let data = {
                        title: $("#changeGroupForm-title").val(),
                        description: $("#changeGroupForm-description").val(),
                    };
                    onConfirm(groupId, data);
                }.bind(args));

            });
        };
    });

var addUser  = new ContentHandler("addUserToGroup",
    function(sidebar, args, type) {

        var group = args.group;
        var groupId = args.groupId;
        var filteredList = args.select
        var onConfirm = args.callback.onConfirm;
        var selectedUser = {};
        var res = {}

        getDataFromServer("/api/v1/groups/"+ groupId,function(context){
            res.group = context;
            res.groupId = groupId;
            action(res)
        });

        var action = function(context) {
            $.get('/webpack/sidebar/templates/roles/sidebar-addUserToGroup.hbs', function (data) {
                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function () {
                    data = {
                        userGroupId: res.group.id,
                        userId: selectedUser.id,
                    };
                    onConfirm(data);
                }.bind(args));

                //setup searchbar
                let searchContainer = document.getElementById("search-container")
                let searchbarContainer = document.getElementById("usersearch");
                var searchbar = new common.Searchbar(searchbarContainer, {
                    onInput: {
                        enabled: true,
                        callback: function (inputValue) {
                            displayUserList(inputValue)
                        },
                    },
                    noLabel: true,
                    classes: "nomargin"
                });


                //hook user query to input element
                function displayUserList(filter) {

                    let handleData = {};
                    let data = {
                        filter: filter,
                        args: {
                            sort: "generalData.lastName.value",
                            filter: {
                                filter: "userGroups",
                                value: {$nin: [groupId]},
                            }
                        }
                    };
                    //get user list from server
                    $.ajax({
                        url: "/api/v1/usermod/filter",
                        type: 'POST',
                        contentType: "application/json; charset=UTF-8",
                        dataType: 'json',
                        data: JSON.stringify(data),
                        success: function (result) {
                            handleData.userlist = result;
                            // render userlist template
                            $.get('/static/unisams/js/sidebar/plugins/userselect-plugin.hbs', function (data) {
                                var template = Handlebars.compile(data);
                                appendContent(template(handleData))
                            });
                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            alert("some error");
                        }
                    });

                    function appendContent(html) {
                        //append to subpage container #userlist-container
                        let container = document.getElementById('sidebar-userselect-container');
                        container.innerHTML = html;

                        //click on user selects it
                        $(".participant-item").on("mousedown", function (e) {
                            e.preventDefault(); //preventDefault to stop blur event before click is fired
                        }).on("click", function (e) {
                            let userid = this.dataset.userid;
                            //hide searchbar, display user item instead
                            let userentry = this.cloneNode(true);

                            searchbar.hide();
                            container.classList.add("hidden");
                            let resultContainer = document.getElementById("sidebar-userselect-result");

                            //create cancel btn
                            let cancelBtn = document.createElement("div");
                            cancelBtn.classList.add("before-icon", "icon-cancel");
                            cancelBtn.addEventListener("click", function () {
                                //reset sidebar
                                sidebar.resetCurrentPage();
                            })
                            userentry.append(cancelBtn);

                            let c = document.createElement("div");
                            c.className = "event-participants";
                            c.append(userentry);
                            resultContainer.append(c);
                            selectedUser.id = userid;

                        });


                        // click outside should hide popup
                        $(searchbar.getInputElement()).blur(function () {
                            if (searchbar.isActive()) {
                                container.classList.add("hidden");
                            }
                        });
                        $(searchbar.getInputElement()).focus(function () {
                            //dont show when searchbar is disabled
                            if (searchbar.isActive()) {
                                container.classList.remove("hidden");
                            }
                        })
                    }
                }
            });
        }
    });

let addGroupPath = new ContentHandler("addGroupPath",
    function(sidebar, args, type) {
        var groupId = args.groupId;
        var onConfirm = args.callback.onConfirm;
        var corrupted = false;

        var res = {};

        getDataFromServer("/api/v1/groups/"+ groupId,function(context){
            res.group = context;
            res.groupId = groupId;
            action(res)
        });

        var action = function(context) {
            $.get('/webpack/sidebar/templates/roles/sidebar-addGroupPath.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                    let data = {
                        url: $("#changeGroupForm-url").val(),
                        method: $("#changeGroupForm-method").val(),
                    };
                    onConfirm(groupId, data);
                }.bind(args));

            });
        };
    });

let updateGroupPath = new ContentHandler("updateGroupPath",
    function(sidebar, args, type) {
        var groupId = args.groupId;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;
        var corrupted = false;
        var currentPermission = args.permission;

        var res = {};

        getDataFromServer("/api/v1/groups/"+ groupId,function(context){
            res.group = context;
            res.groupId = groupId;
            res.permission = currentPermission
            action(res)
        });

        var action = function(context) {
            $.get('/webpack/sidebar/templates/roles/sidebar-changeGroupPath.hbs', function (data) {

                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));

                $("#changeGroupForm-method").val(context.permission.method);

                sidebar.registerBackButton(sidebar, ".sidebar-back-btn");
                sidebar.registerConfirmButton(sidebar, ".sidebar-confirm", function(){
                    let data = {
                        url: $("#changeGroupForm-url").val(),
                        method: $("#changeGroupForm-method").val(),
                        current: currentPermission,
                    };
                    onConfirm(groupId, data);
                }.bind(args));

                sidebar.registerButton (sidebar, ".sidebar-delete", function(){

                    if (corrupted) {
                    }
                    onDelete(groupId, currentPermission);
                }.bind(args));
            });
        };
    });

rolesPlugin.addContentHandler(addGroup);
rolesPlugin.addContentHandler(changeGroup);
rolesPlugin.addContentHandler(addUser);
rolesPlugin.addContentHandler(addGroupPath);
rolesPlugin.addContentHandler(updateGroupPath);

//TODO: make Sidebar a singleton and add static function to access runtime object


/**
 *
 * @param field
 * @param dataset
 * @returns {Object}
 */
var checkDataValidity = function(field, dataset){
    var errorList = [];
    var status = 0;
    for (let [key, value] of Object.entries(dataset)){
        if(typeof(field[key])!==value){
            status = 1;
            errorList.push(key);
        }
    }
    if (errorList.length > 0) {
        var msg = "Failed to read data: " + errorList;
        return [status, msg];
    }
    return [status, ""];
};


/**
 * applies 'viewBox-disabled' class to the given elements
 * @param elements an HTML Element or an array containing HTML Elements
 */
var disableViewBox = function(elements) {
    var func = function(el) {
        el.disabled = true;
        el.classList.add("viewBox-disabled");
    };
    if(Array.isArray(elements)){
        elements.forEach(el=>func(el))
    }
    else func(elements)
};

export {rolesPlugin}