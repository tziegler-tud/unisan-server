// factory for building html elements related to dashboard pages
import {dashActions} from "../actions/dashActions";
import Handlebars from "handlebars";
import * as FilePond from "filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginGetFile from "filepond-plugin-get-file";

var DashPage = function(args){
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
    this.components = [];
    this.componentContainer = this.container;
    //constructor
    return this;
};

DashPage.prototype.componentCounter = {
    current: 0,
    next: function(){
        this.current++
        return this.current;
    }
}

DashPage.prototype.addComponent = function(componentType, args){
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
    this.componentId = componentId;
    this.data = data;
    this.container = document.createElement("div");
    this.container.classList.add("dashPage-component-wrapper");
    switch (this.args.size) {
        case "full":
            this.container.classList.add("dashPage-component-wrapper--full")
            break;
        case "half":
            this.container.classList.add("dashPage-component-wrapper--half");
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
            case (DashPage.componentTypes.NEWS):
                //build description module
                templateUrl = "/webpack/dashboard/pageModules/news.hbs";
                $.get(templateUrl, function (templateData) {
                    template = Handlebars.compile(templateData);
                    self.container.innerHTML = template(handleData);
                    let callback = {};
                    //custom handlers
                    self.args.handlers.forEach(function(handler){
                        handler(self);
                    })
                });
                break;
            case (DashPage.componentTypes.EVENTPREVIEW):
                //show next event
                //get next user event

                let nextEvent = getNextEvent(self.data.user).then(result => {
                    handleData.event = result;
                    templateUrl = "/webpack/dashboard/pageModules/eventPreview.hbs";
                    $.get(templateUrl, function (templateData) {
                        template = Handlebars.compile(templateData);
                        self.container.innerHTML = template(handleData);
                        let callback = {};
                        //custom handlers
                        self.args.handlers.forEach(function(handler){
                            handler(self);
                        })
                    });
                })







                break;
            case (DashPage.componentTypes.LOCATION):
                break;

            case (DashPage.componentTypes.FILES):
                break;
            case (DashPage.componentTypes.GENERIC):
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



DashPage.eventTypes = {
    eventTraining: "1",
    eventSeminar:  "2",
    eventSan:      "3",
    other:         "0",
};

DashPage.componentTypes = {
    NEWS:          "1",
    NOTIFICATIONS: "2",
    EVENTPREVIEW:  "3",
    UPCOMINGEVENTS:"4",
    GENERIC:       "0",
};


var getNextEvent = function (userid){
    let self = this;
    let url;
    let data = {
        userid: userid,
        sort: "date.startDate",
        amount: 1,
    }
    //get user list from server
    return new Promise(function(resolve, reject){
        $.ajax({
            url: "/api/v1/eventmod/userEvents",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(events) {
                resolve(events)
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
                reject(errorThrown)
            }
        });
    })
}

export{DashPage}
