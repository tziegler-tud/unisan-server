import {MDCList} from '@material/list';
import {MDCRipple} from '@material/ripple';


$(document).ready (function () {
    var lidlRTO = window.lidlRTO;
    var user;
    var profile = new window.profile.Profile(window.userId);

    // create new observer
    var ob1 = new lidl.Observer(function(u){
        user = u;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    profile.getUserAndSubscribe(ob1)
        .then(function(user){
            notifyPage({user:user})
        })
        .catch(function(reason){
            console.error("Failed to retrieve user data:" + reason)
        });

    var currentExploredEvent;
    var eventProfile = new window.eventRequest.Event(window.exploreEventId, {
        populateParticipants: true,
    });

    // create new observer
    var ob2 = new lidl.Observer(function(event){
        currentExploredEvent = event;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    eventProfile.getEventAndSubscribe(ob2)
        .then(function(event){
            notifyPage({event: event})
        })
        .catch(function(reason){
            console.error("Failed to retrieve event data:" + reason)
        });

    let pageData = {};
    function notifyPage(obj) {
        Object.assign(pageData, obj);
        if(pageData.user && pageData.event) {
            buildPage(pageData.user, pageData.event)
        }
    }

    function buildPage(user, event) {

        let page = new window.eventPage.EventPage();

        window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("event", event);

        const list = new MDCList(document.querySelector('.mdc-list'));
        const listItemRipples = list.listElements.map((listItemEl) => new MDCRipple(listItemEl));

        $(".download-button").on("click", function(e){
            e.preventDefault();
        });

        $(list.listElements).on("click", function(e){
            e.stopPropagation();
            e.preventDefault();
            let url  = $(this).find(".download-button").first().attr('href');
            window.open(url, '_self');
        })

        let callback = {
            onConfirm: function(editableTextField){
                let delta = editableTextField.getQuill().getContents();
                actions.events.saveDelta(event.id, delta, {
                    onSuccess: function(result){
                        editableTextField = editableTextField.reset(editableTextFieldContainer, result.description.longDesc.delta, result.description.longDesc.html, callback, {readOnly: true})
                    }
                })
            }
        };
        let editableTextFieldContainer = document.getElementById("eventDescribtionEditor");
        let editableTextField = new common.EditableTextField(editableTextFieldContainer, event.description.longDesc.delta, event.description.longDesc.html, callback, {readOnly: true});

        let cb = {
            onConfirm: function(editableInputField){
                let delta = editableInputField.getQuill().getContents();
                let key = "title.delta";
                actions.events.updateKey(event.id, key, delta, {
                    onSuccess: function(result){
                        editableInputField = editableInputField.reset(titleInputContainer, result.title.delta, result.title.html, "text", cb, {readOnly: true})
                    }
                })
            }
        };
        let titleInputContainer = document.getElementById("eventtitle-input");
        let editableInputField = new common.EditableInputField(titleInputContainer, event.title.delta, event.title.html, "text", cb, {readOnly: true});

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
        let userIsParticipant = eventProfile.checkIfUserIsRegistered(user);
        sidebar.addContent("eventParticipants", {
            event: event,
            user: user,
            isParticipant: userIsParticipant,
            callback: {
                onConfirm: function(){
                    window.actions.events.addParticipant(event.id, user.id)
                },
                onDelete: function(){
                    window.actions.events.removeParticipant(event.id, user.id)
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