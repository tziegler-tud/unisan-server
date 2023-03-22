import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";

import {groupActions} from "../actions/actions";
import {Preloader} from "../helpers/preloader"


let events = {
    init: function () {
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: system.events");

        })
    }
};

export {events}