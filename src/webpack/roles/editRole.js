import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";
import {groupActions} from "../actions/groupActions";
import {userActions} from "../actions/userActions";
import {Userlist} from "../helpers/userlist";

import {view} from "./view.js";
import {advanced} from "./advanced.js";



$(document).ready (function () {
    var lidlRTO = window.lidlRTO;

    var actions = window.actions;


    //group is in window.group
    let group = window.group;
    var groupId = window.groupId;



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