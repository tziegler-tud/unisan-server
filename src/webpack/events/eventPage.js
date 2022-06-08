// factory for building html elements related to event pages
import {EditableTextField} from "../helpers/editableTextField";
import {EditableInputField} from "../helpers/editableInputField";
import {eventActions} from "../actions/eventActions";
import Handlebars from "handlebars";
import * as FilePond from "filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginGetFile from "filepond-plugin-get-file";
import {MDCList} from "@material/list";
import {MDCRipple} from "@material/ripple";
import {MDCMenu} from "@material/menu";

var EventPage = function(args){
    let defaults = {
        container: null,
        data: null,
        sidebar: null,
        args: {

        }
    }
    args = (args === undefined) ? {}: args;
    args = Object.assign(defaults, args);

    this.data = args.data;
    this.container = args.container;
    this.sidebar = args.sidebar;
    if(args.data.event === undefined) this.data.event = {}
    this.event = this.data.event;
    this.components = [];
    this.componentContainer = this.container;
    //constructor
    return this;
};

EventPage.prototype.componentCounter = {
    current: 0,
    next: function(){
        this.current++
        return this.current;
    }
}

EventPage.prototype.addComponent = function(componentType, args){
    let self = this;
    let componentId = this.componentCounter.next();
    let component = new Component(componentId, componentType, self.data, args);
    this.components.push(component);
    this.componentContainer.append(component.getHtml());
};

var Component = function(componentId, componentType, data, args){
    let self = this;
    let defaults = {
        allowEdit: true,
        size: "full",
        classes: "",
        order: componentId,
        handlers: [],

    }
    args = (args === undefined) ? {}: args;
    this.args = Object.assign(defaults, args);
    let event = data.event;
    this.componentId = componentId;
    this.container = document.createElement("div");
    this.container.classList.add("eventPage-component-wrapper");
    switch (this.args.size) {
        case "full":
            this.container.classList.add("eventPage-component-wrapper--full")
            break;
        case "half":
            this.container.classList.add("eventPage-component-wrapper--half");
            break;
    }
    this.container.style.order = args.order;
    this.html = this.container;

    this.init = new Promise(function(resolve, reject){
        var templateUrl ="";
        var template;
        let handleData = data;
        handleData.args = {
            allowEdit: self.args.allowEdit,
        };

        switch(componentType) {
            case (EventPage.componentTypes.DESCRIPTION):
                //build description module
                templateUrl = "/webpack/events/pageModules/eventDescription.hbs";
                $.get(templateUrl, function (templateData) {
                    template = Handlebars.compile(templateData);
                    self.container.innerHTML = template(handleData);

                    if (self.args.allowEdit) {

                    }
                    let callback = {
                        onConfirm: function(editableTextField){
                            let delta = editableTextField.getQuill().getText();
                            let key = "description.longDesc.value";
                            eventActions.updateKey(event.id, key, delta, {})
                            delta = editableTextField.getQuill().getContents();
                            eventActions.saveDelta(event.id, delta, {
                                onSuccess: function(result){
                                    editableTextField = editableTextField.reset(editableTextFieldContainer, result.description.longDesc.delta, result.description.longDesc.html, callback, {})
                                }
                            })
                        }
                    };
                    let editableTextFieldContainer = self.container.querySelector(".eventDescriptionEditor");
                    let editableTextField = new EditableTextField(editableTextFieldContainer, event.description.longDesc.delta, event.description.longDesc.html, callback, {readOnly: !args.allowEdit});

                    //custom handlers
                    self.args.handlers.forEach(function(handler){
                        handler(self);
                    })
                });
                break;
            case (EventPage.componentTypes.DATE):
                //build date and location module
                templateUrl = "/webpack/events/pageModules/eventDate.hbs";
                $.get(templateUrl, function (templateData) {
                    template = Handlebars.compile(templateData);
                    self.container.innerHTML = template(handleData);

                    self.args.handlers.forEach(function(handler){
                        handler(self);
                    })

                });
                break;
            case (EventPage.componentTypes.LOCATION):
                break;

            case (EventPage.componentTypes.FILES):
                //build description module
                templateUrl = "/webpack/events/pageModules/eventFiles.hbs";
                $.get(templateUrl, function (templateData) {
                    template = Handlebars.compile(templateData);
                    self.container.innerHTML = template(handleData);
                    const fileList = new MDCList(self.container.querySelector(".eventinfo-material-list"));
                    const listItemRipples = fileList.listElements.map((listItemEl) => new MDCRipple(listItemEl));
                    // const dropdownOptions = list.listElements.forEach(listItemEl => new MDCMenu($(listItemEl).find('.mdc-menu')));

                    if (!self.args.allowEdit) {
                        $(".download-button").on("click", function(e){
                            e.preventDefault();
                        });

                        $(fileList.listElements).on("click", function(e){
                            e.stopPropagation();
                            e.preventDefault();
                            let url  = $(this).find(".download-button").first().attr('href');
                            window.open(url, '_self');
                        })
                    }
                    else {
                        fileList.listElements.forEach(function(listItemEl){
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
                                    eventActions.deleteFileFromStorage(event.id, uniqueId, {
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

                        const inputElement = self.container.querySelector('#materialUploadElement');
                        const pond = FilePond.create( inputElement , {
                            allowMultiple: true,
                            files: [],
                            credits: false,
                            imagePreviewMaxHeight: 100,
                        });
                    }
                    self.args.handlers.forEach(function(handler){
                        handler(self);
                    })
                });
                break;
            case (EventPage.componentTypes.GENERIC):
                //Create empty module
                break;
        }
        resolve();
    })
    return self;
};

Component.prototype.getHtml = function(){
    return this.html;
}



EventPage.eventTypes = {
    eventTraining: "1",
    eventSeminar:  "2",
    eventSan:      "3",
    other:         "0",
};

EventPage.componentTypes = {
    DESCRIPTION:   "1",
    DATE:          "2",
    LOCATION:      "3",
    FILES:         "4",
    PARTICIPANTS:  "5",
    POSTINGS:      "6",
    GENERIC:       "0",
};

export{EventPage}
