//load system modules
import {logs} from "./logs.js";
import {groups} from "./groups.js";
import {user} from "./user.js";
import {events} from "./events.js";
import {qualifications} from "./qualifications.js";
import {auth} from "./auth.js";
import {dev} from "./dev.js";

var phone = window.matchMedia("only screen and (max-width: 50em)");
var tablet = window.matchMedia("only screen and (min-width: 50em) and (max-width: 75em)");

$(document).ready(function () {

    const moduleName = "system";

    //setup module specific loaders
    let loaders = [];
    let logsLoader = {
        title: "logs",
        loader: logs,
    };
    let groupsLoader = {
        title: "groups",
        loader: groups,
    };

    let userLoader = {
        title: "user",
        loader: user,
    };

    let qualificationsLoader = {
        title: "qualifications",
        loader: qualifications,
    }

    let eventsLoader = {
        title: "events",
        loader: events,
    };

    let authLoader = {
        title: "auth",
        loader: auth,
    };

    let devLoader = {
        title: "development",
        loader: dev,
    };
    loaders.push(logsLoader, groupsLoader, userLoader, eventsLoader, qualificationsLoader, authLoader, devLoader);

    //read from window.jsmodule which modules are to be loaded
    let jsmodule = window.jsmodule;
    if (jsmodule === undefined) jsmodule = {};

    if(!jsmodule.module === moduleName) {
        console.error("invalid jsmodule information: Expected " + moduleName + ", but found " + jsmodule.module)
        return false;
    }

    jsmodule.loaders.forEach(function(el){
        //see if corresponding loader is present
        let loader = loaders.find(e => e.title === el);
        if (loader !== undefined) {
            loader.loader.init();
        }
    })

});
