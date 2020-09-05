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

        let page = new window.eventPage.EventPage();

        window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("event", event);

        let callback = {
            onConfirm: function(editableTextField){
                let delta = editableTextField.getQuill().getContents();
                actions.events.saveDelta(event.id, delta, {
                    onSuccess: function(result){
                        editableTextField = editableTextField.reset(editableTextFieldContainer, result.description.longDesc.delta, result.description.longDesc.html, callback, {})
                    }
                })
            }
        };
        let editableTextFieldContainer = document.getElementById("eventdetailseditor");
        let editableTextField = new common.EditableTextField(editableTextFieldContainer, event.description.longDesc.delta, event.description.longDesc.html, callback, {});

        //get event type
        switch(event.type.raw){
            case "eventTraining":
                buildTrainingPage();
                break;
            case "eventSeminar":
                buildSeminarPage();
                break;
            case "eventSan":
                buildSanPage();
                break;
            case undefined:
            default:
        }


        var ddMenu = common.DropdownMenu(".dropdown-menu", "click", ".dropdown-btn");

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

        function buildTrainingPage(){
            page.addComponent(window.eventPage.componentTypes.DESCRIPTION);
            page.addComponent(window.eventPage.componentTypes.DATE);
            page.addComponent(window.eventPage.componentTypes.LOCATION);
        }

        function buildSeminarPage(){

        }

        function buildSanPage(){

        }



    }
});