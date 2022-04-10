import {Sidebar} from "../sidebar/sidebar";
import {userPlugin} from "../sidebar/plugins/plugin-user";

var common = window.common;
var actions = window.actions;


let dash = {
    init: function () {
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: dashboard.dash");

            var sidebar = new Sidebar('wrapper', "test");
            sidebar.addPlugin(userPlugin);

            sidebar.addContent("user", {
                userid: window.userId
            });
            if(phone.matches || tablet.matches) {
                sidebar.hide();
            }
            else {
                sidebar.show();
            }

        })
    }
};

export {dash}