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

        var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

        const deleteContent = {
            title: "Event löschen",
            message: "U sure bro?",
            titleArg: "",
            messageArg: ""
        };

        var deleteArgs = {
            eventid: event.id,
            callback: {
                onConfirm: function () {
                    actions.events.deleteEvent(event.id)
                }
            }
        };

        var token = lidlRTO.objectManager.createNewObjectToken();
        const dialogDeleteEvent = new lidl.Dialog(token, ".eventDelete", 'confirmDelete', deleteContent, deleteArgs);
        lidlRTO.objectManager.addObject(dialogDeleteEvent, token);


        const content2 = {
            title: "Bild hochladen",
        };

        var args2 = {
            eventid: event.id,
            callback: {
                onConfirm: function () {
                }
            }
        };

        var token2 = lidlRTO.objectManager.createNewObjectToken();
        const dialog02 = new lidl.Dialog(token2, ".changeProfilePicture", 'imageUpload', content2, args2);
        lidlRTO.objectManager.addObject(dialog02, token2);

        var manualUploader = new qq.FineUploader({
            element: document.getElementById('imgUpload-' + token2),
            template: 'qq-template-manual-trigger',
            request: {
                method: 'POST',
                endpoint: '/api/v1/eventmod/' + event.id + "/uploadImage",
                inputName: 'image'

            },
            thumbnails: {
                placeholders: {
                    waitingPath: '/lib/fineUploader/placeholders/waiting-generic.png',
                    notAvailablePath: '/lib/fineUploader/placeholders/not_available-generic.png'
                }
            },
            autoUpload: false,
            debug: true,
            multiple: false,

            callbacks: {
                onComplete: function () {
                    const items = $(".userProfileImage");
                    $(items).each(function (img) {
                        const src = $(this).attr("src");
                        $(this).attr("src", src + "?t=" + new Date().getTime());
                    });
                    dialog02.confirmAndClose();
                }
            }
        });

        qq(document.getElementById("confirmBtn" + token2)).attach("click", function () {
            manualUploader.uploadStoredFiles();
        });



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
        let editableTextFieldContainer = document.getElementById("eventDescriptionEditor");
        let editableTextField = new common.EditableTextField(editableTextFieldContainer, event.description.longDesc.delta, event.description.longDesc.html, callback, {});


        let cb = {
            onConfirm: function(editableInputField){
                let delta = editableInputField.getQuill().getContents();
                let key = "title.delta";
                actions.events.updateKey(event.id, key, delta, {
                    onSuccess: function(result){
                        editableInputField = editableInputField.reset(titleInputContainer, result.title.delta, result.title.html, "text", cb, {})
                    }
                })
            }
        };
        let titleInputContainer = document.getElementById("eventtitle-input");
        let editableInputField = new common.EditableInputField(titleInputContainer, event.title.delta, event.title.html, "text", cb, {});

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