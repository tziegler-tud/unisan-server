var lidlRTO = window.lidlRTO;
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

        window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("event", event);

        var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

        var sidebar = new common.Sidebar('wrapper', {title: "Test"});
        // init event sidebar
        //find if current user is already registered
        let userIsParticipant = eventProfile.checkIfUserIsRegistered(window.user);
        sidebar.addContent("eventParticipants", {
            event: event,
            user: window.user,
            isParticipant: userIsParticipant,
            callback: {
                onConfirm: function(){
                    window.actions.events.addParticipant(event.id, window.user.id)
                },
                onDelete: function(){
                    window.actions.events.removeParticipant(event.id, window.user.id)
                }
            },
        });
        sidebar.show();

        displayParticipantsList("");



        $('.add-participant-button').each(function(){
            $(this).on("click", function(e){
                e.preventDefault();
                sidebar.addContent("addEventParticipant", {
                    event: event,
                    user: window.user,
                    isParticipant: userIsParticipant,
                    callback: {
                        onConfirm: function(data){
                            window.actions.events.addParticipant(event.id, data.userid)
                        },
                        onDelete: function(){
                            window.actions.events.removeParticipant(event.id, window.user.id)
                        }
                    },
                });
                sidebar.show();


            })
        });


        function displayParticipantsList(filter) {

            var handleData = event;

            // render participantslist template
            $.get('/static/unisams/js/events/templates/participantslist.hbs', function (data) {
                var template = Handlebars.compile(data);
                appendContent(template(handleData))
            });

            function appendContent(html) {
                //append to subpage container #userlist-container
                let container = document.getElementById('userlist-container');
                container.innerHTML = html;

                //delay adjustment until sidebar finished rendering
                setTimeout(function(){
                 adjustList(container)
                }, 250);
                // hook user entries to sidebar.


                $('.participant-role-select').each(function(){
                    //display current role

                    $(this).on("change", function(e){
                        //push changes to server
                        let userId = e.target.dataset.userid;
                        let role = e.target.value;
                        console.log("changed role for uid: " + userId + " to " + role);
                        actions.events.changeParticipant(event.id, userId, role);
                    })

                });

                $('.participant-delete').each(function(){
                    $(this).on("click", function(e){
                        //push changes to server
                        e.preventDefault();
                        let userId = e.target.dataset.userid;
                        actions.events.removeParticipant(event.id, userId);
                    })

                });



            }
            function adjustList(c) {
                let container = c === undefined ? document.getElementById('userlist-container') : c;
                // set width of first row
                let row = document.getElementById("userlist-top");

                //get viewport height
                const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                //get height of top navigation and topbar element
                let navHeight = document.getElementById("nav-top").clientHeight +1;
                let topbarHeight = document.getElementById("content1-heading").clientHeight;
                //calc remaining height
                let h = vh - (navHeight + topbarHeight + row.clientHeight + 10);
                //set element height
                $(container).css({
                    "height": h + "px",
                    "overflow": "auto",
                });

                //get scollbar width
                let scrollbarWidth = container.offsetWidth - container.clientWidth;
                $("#userlist-top").css({
                    "width": "auto",
                    "padding-right": scrollbarWidth + "px",
                })
            }


            $(window).on('resize',function(){
                adjustList();
            });
        }
    }
});