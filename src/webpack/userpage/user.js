import "../user/userprofile.scss";
import "./user.scss";

import {userActions, eventActions, groupActions} from "../actions/actions"
// import {profile} from "./profile";
import {events} from "./events";
import {settings} from "./settings";
// import {notifications} from "./notifications";

$(document).ready (function () {

    var lidlRTO = window.lidlRTO;

    let moduleName = "user";


    //setup module specific loaders
    let loaders = [];
    // let profileLoader = {
    //     title: "profile",
    //     loader: profile,
    // };
    let eventsLoader = {
        title: "events",
        loader: events,
    };

    let settingsLoader = {
        title: "settings",
        loader: settings,
    };
    // let logsLoader = {
    //     title: "logs",
    //     loader: logs,
    // };

    // loaders.push(profileLoader, eventsLoader, settingsLoader, logsLoader);
    loaders.push(eventsLoader, settingsLoader);

    //read from window.jsmodule which modules are to be loaded
    let jsmodule = window.jsmodule;
    if (jsmodule === undefined) jsmodule = {};


    let defaultArgs = {
        allowEdit: false,
        edit: false,
    };
    let args = Object.assign(defaultArgs, jsmodule.args);


    if(!jsmodule.module === moduleName) {
        console.error("invalid jsmodule information: Expected " + moduleName + " , but found " + jsmodule.module)
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