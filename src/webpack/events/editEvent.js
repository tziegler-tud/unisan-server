import * as FilePond from 'filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginGetFile from 'filepond-plugin-get-file';
import {MDCList} from "@material/list";
import {MDCRipple} from "@material/ripple";
import {MDCMenu} from '@material/menu';

var phone = window.matchMedia("only screen and (max-width: 50em)");
var tablet = window.matchMedia("only screen and (min-width: 50em) and (max-width: 75em)");


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

        const list = new MDCList(document.querySelector('.mdc-list'));
        const listItemRipples = list.listElements.map((listItemEl) => new MDCRipple(listItemEl));
        // const dropdownOptions = list.listElements.forEach(listItemEl => new MDCMenu($(listItemEl).find('.mdc-menu')));
        const dropdownOptions = list.listElements.forEach(function(listItemEl){
            var it = $(listItemEl).parent(".mdc-list-item-wrapper").find('.mdc-menu');
            var menu;
            $(it).each(function(index){
                menu = new MDCMenu(this);
                menu.open = false;
                listItemEl.menu = menu;
                $(listItemEl).click(function(e){
                    this.menu.open = true;
                })
                $(menu.items).closest(".menu-entry-delete").on("click", function(e) {

                    let uniqueId = this.dataset.id;
                    actions.events.deleteFileFromStorage(event.id, uniqueId, {
                        onSuccess: function(){
                            $(listItemEl).parent(".mdc-list-item-wrapper").next(".mdc-list-divider").remove();
                            listItemEl.remove();
                        },
                    })
                });
                $(menu.items).closest(".menu-entry-download").on("click", function(e) {
                    let url  = $(this).find(".download-button").first().attr('href');
                    window.open(url, '_self');
                });

            })

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
        if(phone.matches || tablet.matches) {
            sidebar.hide();
        }
        else {
            sidebar.show();
        }

        $("#eventDateEditor").on("click", function(){
            sidebar.addContent("editEventDate", {
                event: event,
                callback: {
                    onConfirm: function(eventid, data){
                        window.actions.events.updateDate(event.id, {date: data.date, startTime: data.startTime, endTime: data.endTime }, {
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

        //initialize filepond
        FilePond.setOptions(
            {
                server: {
                    url: '/api/v1/eventmod/' + event.id + "/uploadFile",
                    load: '/load/',
                    restore: '/load/',
                    remove: (source, load, error) => {
                        console.error("REMOVE")
                    }

                },
            });
        FilePond.registerPlugin(FilePondPluginImagePreview, FilePondPluginGetFile);

        //find previously uploaded files
        // let files = [];
        // event.files.forEach(function(file) {
        //     files.push({
        //         source: file.filename,
        //         options: {
        //             type: 'limbo'
        //         }
        //     })
        // })
        // FilePondPluginImagePreview.allowImagePreview
        const inputElement = document.querySelector('#materialUploadElement');
        const pond = FilePond.create( inputElement , {
            allowMultiple: true,
            files: [],
            credits: false,
            imagePreviewMaxHeight: 100,
        });

    }
});