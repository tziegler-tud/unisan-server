import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";

import {groupActions} from "../actions/actions";


var actions = window.actions;


let user = {
    init: function () {
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: settings.user");

        })
    }
};

export {user}