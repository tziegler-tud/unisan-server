import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";

import {groupActions} from "../actions/actions";
import {Preloader} from "../helpers/preloader"


let groups = {
    init: function () {
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: settings.roles");

            //init sidebar
            let addDBKey_sidebar = new Sidebar('wrapper', "test");
            addDBKey_sidebar.addPlugin(rolesPlugin);

            $(".addRoleButton").on("click", function (e) {
                e.preventDefault();
                addDBKey_sidebar.addContent('addGroup', {
                        callback: {
                            onConfirm: function (data, args) {
                                groupActions.addGroup(data, args);
                            }
                        }
                    },
                );
                addDBKey_sidebar.show();
            });
        })
    }
};

export {groups}