import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {userActions} from "../actions/userActions";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";

var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");

$(document).ready (function () {
    buildPage();

    function buildPage(result) {
        var lidlRTO = window.lidlRTO;

        var actions = window.actions;

        var sidebar = new Sidebar('wrapper', "test");
        sidebar.addPlugin(userPlugin);

        var handleData = {};

        //display all users initially
        displayUserList("");

        //setup searchbar
        let searchbarContainer = document.getElementById("usersearch");
        var searchbar = new Searchbar(searchbarContainer, {
            onInput: {
                enabled: true,
                callback: function(inputValue){
                    displayUserList(inputValue)
                },
            },
        });

        function displayUserList(filter) {
            let sort = "generalData.memberId.value";
            let data = {
                filter: filter,
                args: {
                    sort: sort,
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
                    let container = document.getElementById('userlist-container');
                    let args = {
                        enableMobile: false,
                        height: "full",
                        sorting: {
                            property: sort,
                            direction: 1,
                        }
                    }
                    let callback = {
                        listItem: {
                            onClick: function(e){
                                let self = e.currentTarget;
                                e.preventDefault();
                                sidebar.addContent("user", {
                                    userid: self.dataset.userid
                                });
                                sidebar.show();
                            }
                        }
                    }
                    let scrollableList = new ScrollableList(container, "user", result, args, callback)
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
                }
            });
        }

        $('.radio-item').checkboxradio({
            icon: false,
            classes: {
                "ui-checkboxradio-label": "toggleButton",
                "ui-checkboxradio-checked": "toggleButton-checked"
            }
        });
        $('#userlist02').checkboxradio({
            disabled: true
        });

        $(".useredit-addUserBtn").on("click", function (e) {
            e.preventDefault();
            sidebar.addContent('addUser', {
                    userid: null,
                    callback: {
                        onConfirm: function (username, password, generalData, memberId) {
                            let args = {
                                data: {
                                    username: username,
                                    password: password,
                                    generalData: generalData,
                                },
                                memberId: memberId
                            };
                            actions.addUser(args);
                        }
                    }
                },
            );
            sidebar.show();
        });
    }
});