import {userActions, eventActions, groupActions} from "../actions/actions"
import {dash} from "./dash";
import {events} from "./events";
import {notifications} from "./notifications";

$(document).ready (function () {

    var lidlRTO = window.lidlRTO;
    var common = window.common;


    //setup module specific loaders
    let loaders = [];
    let dashLoader = {
        title: "dash",
        loader: dash,
    };
    let eventsLoader = {
        title: "events",
        loader: events,
    };

    let notificationsLoader = {
        title: "notifications",
        loader: notifications,
    };
    loaders.push(dashLoader, eventsLoader, notificationsLoader);

    //read from window.jsmodule which modules are to be loaded
    let jsmodule = window.jsmodule;
    if (jsmodule === undefined) jsmodule = {};

    if(!jsmodule.module === "dashboard") {
        console.error("invalid jsmodule information: Expected 'settings', but found " + jsmodule.module)
        return false;
    }

    jsmodule.loaders.forEach(function(el){
        //see if corresponding loader is present
        let loader = loaders.find(e => e.title === el);
        if (loader !== undefined) {
            loader.loader.init();
        }
    })

})