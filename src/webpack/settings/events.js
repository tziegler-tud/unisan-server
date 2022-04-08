import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";

import {groupActions} from "../actions/actions";

var common = window.common;
var actions = window.actions;


let events = {
    init: function () {
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: settings.events");

        })
    }
};

export {events}