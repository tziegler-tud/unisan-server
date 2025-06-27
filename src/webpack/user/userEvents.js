import "./userprofile.scss";

import Sidebar from "../sidebar/Sidebar";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {userActions} from "../actions/userActions";
import {UserProfile} from "../userprofile/userprofile";

import {lidl} from "/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {DropdownMenu} from "../helpers/dropdownMenu";
import ScrollableList from "../scrollableList/ScrollableList";
import {dateFromNow} from "../helpers/helpers";
import Searchbar from "../widgets/searchbar/SearchBar";

$(document).ready (function () {

    var lidlRTO = window.lidlRTO;

    var actions = window.actions;

    var currentExploredUser;
    var profile = new UserProfile(window.exploreUserId);

    // create new observer
    var observer = new lidlObserver(function(user){
        currentExploredUser = user;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    profile.getUserAndSubscribe(observer)
        .then(function(user){
            buildPage(user)
        })
        .catch(function(reason){
            console.error("Failed to retrieve user data:" + reason)
        });

    function buildPage(user) {

        // window.DockerElement = new docker.Docker(window.dockerArgs);
        if (window.allowedit) {
            window.DockerElement.addDockerSubPage("userEdit", user, {}, undefined, {currentUser: {edit: window.allowedit}});
        }
        else {
            window.DockerElement.addDockerSubPage("user", user, {}, undefined, {currentUser: {edit: window.allowedit}});
        }

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

        var addDBKey_sidebar = new Sidebar('wrapper', "test");
        addDBKey_sidebar.addPlugin(userPlugin);

        let container = document.getElementById("eventlist-container");
        let searchbarContainer = document.getElementById("eventsearch");
        let scrollableList;
        let listArgs = {
            height: "fixed",
            fixedHeight: "500px",
            sorting: {
                property: "date.startDate",
                direction: 1,
            }
        }
        let listCallback = {
            listItem: {
                onClick: function(e){
                    let self = e.currentTarget;
                    e.preventDefault();
                    window.location = "/events/view/"+self.dataset.id;
                }
            }
        }

        getEvents(user.id, {sort: "date.startDate"})
            .then(events => {
                //get event history
                scrollableList = new ScrollableList(container, "event", events, listArgs, listCallback)
            })

        let filterDate = dateFromNow({weeks: -4});
        let searchbar = new Searchbar(searchbarContainer, {
            onInput: {
                enabled: true,
                callback: function(inputValue){
                    getEvents(user.id, {matchString: inputValue})
                        .then(events => {
                            scrollableList = new ScrollableList(container, "event", events, listArgs, listCallback)
                        })
                        .catch(err => {
                            reject(err)
                        })
                },
            },
        });

    }
    function getEvents (userid, options){
        let defaultOptions = {
            filter: {},
            matchString: "",
        }
        options = Object.assign(defaultOptions, options)
        let self = this;
        let url;
        let dateFilterObj = options.dateFilter;
        let userFilter = {
            filter: "participants.user",
            value: userid
        }
        let data = {
            userid: userid,
            matchString: options.matchString,
            filter: options.filter,
            args: {
                sort: options.sort,
                dateFilter: dateFilterObj,
                filter: userFilter,
            }};
        //get user list from server
        return new Promise(function(resolve, reject){
            $.ajax({
                url: "/api/v1/eventmod/userevents/",
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(events) {
                    resolve(events)
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
                    reject(errorThrown)
                }
            });
        })
    }
});