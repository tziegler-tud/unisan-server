import "../user/userprofile.scss";
import "./settings.scss";

import {userActions, eventActions, groupActions} from "../actions/actions"
import {authSettings} from "./authSettings";

$(document).ready (function () {

    var lidlRTO = window.lidlRTO;

    let moduleName = "settings";


    //setup module specific loaders
    let loaders = [];

    let authLoader = {
        title: "authSettings",
        loader: authSettings,
    };

    loaders.push(authLoader);
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