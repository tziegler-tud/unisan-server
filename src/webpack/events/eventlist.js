import "./eventlist.scss";

var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");
const {ScrollableList} = require("../scrollableList/scrollableList");
const {Sidebar} = require("../sidebar/sidebar");
import {Searchbar} from "../searchbar/searchbar";

var phone = window.matchMedia("only screen and (max-width: 50em)");
var tablet = window.matchMedia("only screen and (min-width: 50em) and (max-width: 75em)");

$(document).ready (function () {
    buildPage();

    function buildPage(result) {

        //read from window.jsmodule which modules are to be loaded
        let dateFilter = window.dateFilter;
        if (dateFilter === undefined) dateFilter = "all";


        var lidlRTO = window.lidlRTO;
        var sidebar = new Sidebar('wrapper', "test");
        var handleData = {};

        let view = "list";
        let scrollableList;

        $('.radio-item').checkboxradio({
            icon: false,
            classes: {
                "ui-checkboxradio-label": "toggleButton",
                "ui-checkboxradio-checked": "toggleButton-checked"
            }
        });
        let checked= $('input[name=eventlist-radio]:checked');
        let listRadio = $("#eventlist01");
        let cardsRadio = $("#eventlist02");
        listRadio.on("change", function(){
            if (view === "cards") {
                view = "list";
                scrollableList.setView("list")
            }
        });
        cardsRadio.on("change", function(){
            if (view === "list") {
                view = "cards";
                scrollableList.setView("cards")
            }
        })
        //try to recreate checked state across page reloads
        if (checked.val()){
            view = checked.val();
        }


        //display all users initially
        displayEventList(dateFilter, "", view)
            .then(result => {
                scrollableList = result;
            })
            .catch(err => {
                alert(err.XMLHttpRequest.status + ": " + err.textStatus);
            })


        //setup searchbar
        let searchbarContainer = document.getElementById("usersearch");
        var searchbar = new Searchbar(searchbarContainer, {
            onInput: {
                enabled: true,
                callback: function(inputValue){
                    displayEventList(dateFilter, inputValue, view)
                        .then(result => {
                            scrollableList = result;
                        })
                        .catch(err => {
                            alert(err.XMLHttpRequest.status + ": " + err.textStatus);
                        })
                },
            },
        });

        function displayEventList(dateFilter, filter, initialView) {

            let url;
            let dateFilterObj = {}
            switch(dateFilter) {

                case "upcoming":
                    url = "/api/v1/eventmod/filter";
                    dateFilterObj = {
                        selector: "gte"
                    }
                    break;
                case "past":
                    url = "/api/v1/eventmod/filter";
                    dateFilterObj = {
                        selector: "lte"
                    }
                    break;
                default:
                case "all":
                    url = "/api/v1/eventmod/filter";
                    dateFilterObj = {
                    }
                    break;
            }

            let sort = "date.startDate";
            let data = {
                filter: filter,
                args: {
                    sort: sort,
                    dateFilter: dateFilterObj,
                }
            };
            //get user list from server
            return new Promise(function(resolve, reject){
                $.ajax({
                    url: url,
                    type: 'POST',
                    contentType: "application/json; charset=UTF-8",
                    dataType: 'json',
                    data: JSON.stringify(data),
                    success: function(result) {
                        let events = result;
                        let args = {
                            height: "full",
                            sorting: {
                                property: sort,
                                direction: 1,
                            },
                            view: initialView,
                            acl: window.dockerAcl,
                        }
                        let callback = {
                            listItem: {
                                onClick: function(e){
                                    let self = e.currentTarget;
                                    e.preventDefault();
                                    window.location = "/unisams/events/view/"+self.dataset.id;

                                }
                            }
                        }
                        let container = document.getElementById('eventlist-container');
                        let scrollableList = new ScrollableList(container, "event", events, args, callback);
                        resolve(scrollableList)

                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        reject({XMLHttpRequest: XMLHttpRequest, textStatus: textStatus, errorThrown: errorThrown});
                    }
                });
            })

        }
    }
});