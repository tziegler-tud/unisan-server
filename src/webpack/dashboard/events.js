
var common = window.common;
var actions = window.actions;


let events = {
    init: function () {
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: dashboard.events");

            displayEventList(window.userId, "");

        })
    }

};

function displayEventList(userid, filter) {
    var handleData = {};
    let sort = "date.startDate";
    let url;
    let dateFilterObj = {
        // selector: "gte"
    }
    let userFilter = {
        filter: "participants.user",
        value: userid
    }
    let data = {
        filter: filter,
        args: {
            sort: sort,
            dateFilter: dateFilterObj,
            filter: userFilter,
        }};
    //get user list from server
    $.ajax({
        url: "/api/v1/eventmod/filter",
        type: 'POST',
        contentType: "application/json; charset=UTF-8",
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(result) {
            handleData.userlist = result;
            let container = document.getElementById('eventlist-container');
            let args = {
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

                    }
                }
            }
            let scrollableList = new common.ScrollableList(container, "event", result, args, callback)
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
        }
    });
}

export {events}