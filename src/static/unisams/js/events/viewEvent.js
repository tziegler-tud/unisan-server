var lidlRTO = window.lidlRTO;

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

        let quillcontainer = document.getElementById("eventdetailseditor")

        const quill = new Quill(quillcontainer, {
            theme: 'bubble',
            bounds: quillcontainer,

        });

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



    }
});