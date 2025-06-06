import Sidebar from "../sidebar/Sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";

import {groupActions} from "../actions/groupActions";
import PageModule from "../utils/PageModule";


export default new PageModule({
    title: "system.groups",
    pageData: {},
    init: async function (args) {
            //init sidebar
        let addDBKey_sidebar = new Sidebar('wrapper', "test");
        addDBKey_sidebar.addPlugin(rolesPlugin);
        window.sidebar = addDBKey_sidebar;
        return {args: {sidebar: addDBKey_sidebar}, data: {}}

    },
    buildPage: async function({args={}, data={}}={}) {
        const sidebar = args.sidebar ?? window.sidebar;
        $(".addRoleButton").on("click", function (e) {
            e.preventDefault();
            sidebar.addContent('addGroup', {
                    callback: {
                        onConfirm: function (data, args) {
                            groupActions.addGroup(data, args);
                        }
                    }
                },
            );
            sidebar.show();
        });
    }

})
