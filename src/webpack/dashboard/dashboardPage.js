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
        minWidth: undefined,
        limitAmount: 1,
        handlers: [],
        disableDefaultHandler: false,
    }

    args = (args === undefined) ? {}: args;
    this.args = Object.assign(defaults, args);
    this.componentId = componentId;
    this.data = Object.create(data);
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
    if(this.args.minWidth) {
        this.container.style.flex = "1 1 " + this.args.minWidth;
        this.container.style.minWidth = "50%";
    }
    this.container.style.order = args.order;
    this.html = this.container;

    this.init = new Promise(function(resolve, reject){
        var templateUrl ="";
        var template;
        let handleData = Object.create(data);
        handleData.args = self.args;

        switch(componentType) {
            case (DashPage.componentTypes.NEWS):

                let currentNews = getNews(args.limitAmount).then(result => {
                    handleData.news = result;
                    templateUrl = "/webpack/dashboard/pageModules/news.hbs";
                    $.get(templateUrl, function (templateData) {
                        template = Handlebars.compile(templateData);
                        self.container.innerHTML = template(handleData);
                        let callback = {};
                        //custom handlers
                        self.args.handlers.forEach(function (handler) {
                            handler(self);
                        })
                    });
                })
                break;
            case (DashPage.componentTypes.EVENTPREVIEW):
                //show next event
                //get next user event

                let nextEvents = getNextEvents(self.data.user.id).then(result => {
                    handleData.events = result;
                    templateUrl = "/webpack/dashboard/pageModules/eventPreview.hbs";
                    $.get(templateUrl, function (templateData) {
                        template = Handlebars.compile(templateData);
                        self.container.innerHTML = template(handleData);
                        let callback = {};
                        //onclick handler
                        const cards = self.container.querySelectorAll(".eventCard");
                        if(!self.args.disableDefaultHandler){
                            cards.forEach(card => {
                                card.addEventListener("click", function(){
                                    window.location="/events/"+card.dataset.viewkey;
                                })
                            })
                        }

                        //custom handlers
                        self.args.handlers.forEach(function(handler){
                            handler(self);
                        })
                    });
                })
                break;
            case (DashPage.componentTypes.ACTIVITY):
                //show activity report

                let activityReport = getActivityReport(self.data.user.id, {limit: args.limitAmount, logTypes: args.logTypes}).then(result => {
                    handleData.data = result;
                    templateUrl = "/webpack/dashboard/pageModules/activity.hbs";
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
            case (DashPage.componentTypes.OPENINGS):
                //show available postings

                break;
            case (DashPage.componentTypes.NOTIFICATIONS):
                break;
            case (DashPage.componentTypes.UPCOMINGEVENTS):
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
    ACTIVITY:      "5",
    OPENINGS:      "6",
    GENERIC:       "0",
};


var getNextEvents = function (userid){
    let self = this;
    let url;
    let data = {
        userid: userid,
        sort: "date.startDate",
        startDate: Date.now(),
        amount: 2,
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


var getNews = function (limit){
    let self = this;
    let data = {
        filter: [

        ],
        args: {
            sort: {"created":-1},
            or: true,
            limit: limit,
        }
    }
    //get news list from server
    return new Promise(function(resolve, reject){
        $.ajax({
            url: "/api/v1/news/filter",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(news) {
                resolve(news)
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
                reject(errorThrown)
            }
        });
    })
}


var getActivityReport = function (userid, {limit, logTypes=["activity"]}){
    let self = this;
    let url;

    let data = {
        filter: [
            {
                filter: "logType",
                value: {"$in": logTypes}
            },
            {
                filter: "target.targetObjectId",
                value: userid,
            }
        ],
        args: {
            or: true,
            limit: limit,
        }

    }
    //get user list from server
    return new Promise(function(resolve, reject){
        $.ajax({
            url: "/api/v1/logs/get/filter",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                resolve(result)
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
                reject(errorThrown)
            }
        });
    })
}

export{DashPage}
