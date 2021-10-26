//load settings modules
import {logs} from "./logs.js";
import {groups} from "./groups.js";

var phone = window.matchMedia("only screen and (max-width: 50em)");
var tablet = window.matchMedia("only screen and (min-width: 50em) and (max-width: 75em)");

$(document).ready(function () {

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
    loaders.push(logsLoader, groupsLoader);

    //read from window.jsmodule which modules are to be loaded
    let jsmodule = window.jsmodule;
    if (jsmodule === undefined) jsmodule = {};

    if(!jsmodule.module === "settings") {
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

});
