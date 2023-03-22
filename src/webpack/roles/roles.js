import {view} from "./view.js";
import {advanced} from "./advanced.js";



$(document).ready (function () {

    const moduleName = "roles";

    //setup module specific loaders
    let loaders = [];
    let viewLoader = {
        title: "view",
        loader: view,
    };
    let advancedLoader = {
        title: "advanced",
        loader: advanced,
    };
    loaders.push(viewLoader, advancedLoader);

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