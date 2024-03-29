var lidlRTO = window.lidlRTO;
var common = window.common;
var actions = window.actions;


$(document).ready (function () {
    var currentExploredEvent;
    var eventProfile = new window.eventRequest.Event(window.exploreEventId, {
        populateParticipants: true,
    });

    // create new observer
    var observer = new lidl.Observer(function(event){
        currentExploredEvent = event;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    eventProfile.getEventAndSubscribe(observer)
        .then(function(event){
            buildPage(event)
        })
        .catch(function(reason){
            console.error("Failed to retrieve event data:" + reason)
        });

    function buildPage(event) {

        // window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("event", event, {}, undefined, {currentEvent: {edit: window.allowedit}});
        var sidebar = new common.Sidebar('wrapper', {title: "Test"});

        var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

        //get Logs for user
        actions.getLogs(event.id, "ALL", {
            onSuccess: function(result){
                displayLogList(result);
            }
        })
        function displayLogList(result) {
            let container = document.getElementById('loglist-container');
            let args = {
                height: "full",
                sorting: {
                    property: "timestamp",
                    direction: -1,
                }
            }
            let callback = {
                listItem: {
                    onClick: function(e){
                        let self = e.currentTarget;
                        e.preventDefault();
                        //get full log from results
                        let logObj = result.find(function(el){
                            return el.id === self.dataset.logid;
                        })
                        sidebar.addContent("logDetails", {
                            log: logObj
                        });
                        sidebar.show();
                    }
                }
            }
            let scrollableList = new common.ScrollableList(container, "log", result, args, callback)

            // var handleData = {logs: result};
            //
            // // render participantslist template
            // $.get('/static/unisams/js/userprofile/templates/loglist.hbs', function (data) {
            //     var template = Handlebars.compile(data);
            //     appendContent(template(handleData))
            // });
            //
            // function appendContent(html) {
            //     //append to subpage container #userlist-container
            //     let container = document.getElementById('loglist-container');
            //     container.innerHTML = html;
            //
            //     //delay adjustment until sidebar finished rendering
            //     setTimeout(function(){
            //      adjustList(container)
            //     }, 250);
            //     // hook log entries to sidebar.
            //     $('.log-entry').each(function () {
            //         $(this).on("click", function (e) {
            //             let self = e.currentTarget;
            //             e.preventDefault();
            //             //get full log from results
            //             let logObj = result.find(function(el){
            //                 return el.id === self.dataset.logid;
            //             })
            //             sidebar.addContent("logDetails", {
            //                 log: logObj
            //             });
            //             sidebar.show();
            //         })
            //     });
            //
            //
            // }
            // function adjustList(c) {
            //     let container = c === undefined ? document.getElementById('loglist-container') : c;
            //     // set width of first row
            //     let row = document.getElementById("loglist-top");
            //
            //     //get viewport height
            //     const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            //     //get height of top navigation and topbar element
            //     let navHeight = document.getElementById("nav-top").clientHeight +1;
            //     let topbarHeight = document.getElementById("content1-heading").clientHeight;
            //     //calc remaining height
            //     let h = vh - (navHeight + topbarHeight + row.clientHeight + 10);
            //     //set element height
            //     $(container).css({
            //         "height": h + "px",
            //         "overflow": "auto",
            //     });
            //
            //     //get scollbar width
            //     let scrollbarWidth = container.offsetWidth - container.clientWidth;
            //     $(row).css({
            //         "width": "auto",
            //         "padding-right": scrollbarWidth + "px",
            //     })
            // }
            //
            // $(window).on('resize',function(){
            //     adjustList();
            // });
        }
    }
});