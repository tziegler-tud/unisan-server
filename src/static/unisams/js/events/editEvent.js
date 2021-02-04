var lidlRTO = window.lidlRTO;

$(document).ready (function () {

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

        window.DockerElement = new docker.Docker(window.dockerArgs);
        let eventDockerPageId = window.DockerElement.addDockerSubPage("event", event, {});

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
                let delta = editableTextField.getQuill().getText();
                let key = "description.longDesc.value";
                actions.events.updateKey(event.id, key, delta, {})
                delta = editableTextField.getQuill().getContents();
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
                let delta = editableInputField.getQuill().getText();
                let key = "title.value";
                actions.events.updateKey(event.id, key, delta, {})
                delta = editableInputField.getQuill().getContents();
                key = "title.delta";
                actions.events.updateKey(event.id, key, delta, {
                    onSuccess: function(result){
                        editableInputField = editableInputField.reset(titleInputContainer, result.title.delta, result.title.html, "text", cb, {})
                        //update docker nav
                        eventProfile.refreshEvent()
                            .then(function(ev){
                                event = ev;
                                window.DockerElement.subpageHandler.update(eventDockerPageId, "event", event)
                            })
                            .catch(function(err){
                                throw new Error(err)
                            });
                    }
                })
            }
        };
        let titleInputContainer = document.getElementById("eventtitle-input");
        let editableInputField = new common.EditableInputField(titleInputContainer, event.title.delta, event.title.html, "text", cb, {limit: 40});

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

        $("#eventDateEditor").on("click", function(){
            sidebar.addContent("editEventDate", {
                event: event,
                callback: {
                    onConfirm: function(eventid, data){
                        window.actions.events.updateDate(event.id, {date: data.date, startTime: data.startTime, endTime: data.endTime });
                    },
                },
            });
            sidebar.show();
        })
        $("#eventLocationEditor").on("click", function(){
            sidebar.addContent("editEventLocation", {
                event: event,
                callback: {
                    onConfirm: function(eventid, data){
                        window.actions.events.updateKey(event.id, "location", {value: data.location}, {
                            onSuccess: function(){
                                window.location.reload();
                            },
                            onError: function(error) {
                                sidebar.addErrorMessage("Failed to save entry to database: " + error.msg, null, true, false)
                            }
                        });
                    },
                },
            });
            sidebar.show();
        })
    }
});