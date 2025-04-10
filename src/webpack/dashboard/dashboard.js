import {dash} from "./dash";
import {events} from "./events";
import {activity} from "./activity";
import {news} from "./news";

$(document).ready (function () {

    var lidlRTO = window.lidlRTO;

    const moduleIdentifier = "dashboard";



    //setup module specific loaders
    let loaders = [];
    let dashLoader = {
        title: dash.title,
        loader: dash,
    };
    let eventsLoader = {
        title: events.title,
        loader: events,
    };

    let notificationsLoader = {
        title: activity.title,
        loader: activity,
    };
    let newsLoader = {
        title: news.title,
        loader: news,
    };
    loaders.push(dashLoader, eventsLoader, notificationsLoader, newsLoader);

    //read from window.jsmodule which modules are to be loaded
    let jsmodule = window.jsmodule;
    if (jsmodule === undefined) jsmodule = {};


    let defaultArgs = {
        allowEdit: false,
        edit: false,
    };
    let args = Object.assign(defaultArgs, jsmodule.args);


    if(!jsmodule.module === moduleIdentifier) {
        console.error("invalid jsmodule information: Expected "+ moduleIdentifier + " but found " + jsmodule.module)
        return false;
    }

    jsmodule.loaders.forEach(function(el){
        //see if corresponding loader is present
        let loader = loaders.find(e => e.title === el);
        if (loader !== undefined) {
            loader.loader.init(args);
        }
    })

})