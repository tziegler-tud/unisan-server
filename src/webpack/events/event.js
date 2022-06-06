//load settings modules
import {eventDetails} from "./eventDetails.js";
import {eventParticipants} from "./eventParticipants.js";
import {eventPostings} from "./eventPostings.js";
import {eventLogs} from "./eventLogs.js";

import {phone, tablet} from "../helpers/variables";

$(document).ready(function () {

    //setup module specific loaders
    let loaders = [];
    let detailsLoader = {
        title: "eventDetails",
        loader: eventDetails,
    };
    let participantsLoader = {
        title: "eventParticipants",
        loader: eventParticipants,
    };

    let postingsLoader = {
        title: "eventPostings",
        loader: eventPostings,
    };

    let logsLoader = {
        title: "eventLogs",
        loader: eventLogs,
    };

    loaders.push(detailsLoader, participantsLoader, logsLoader, postingsLoader);

    //read from window.jsmodule which modules are to be loaded
    let jsmodule = window.jsmodule;
    if (jsmodule === undefined) jsmodule = {};

    let defaultArgs = {
            allowEdit: false,
            edit: false,
    };
     let args = Object.assign(defaultArgs, jsmodule.args);

    if(!jsmodule.module === "event") {
        console.error("invalid jsmodule information: Expected 'event', but found " + jsmodule.module)
        return false;
    }

    jsmodule.loaders.forEach(function(el){
        //see if corresponding loader is present
        let loader = loaders.find(e => e.title === el);
        if (loader !== undefined) {
            loader.loader.init(args);
        }
    })

});
