import {Sidebar, SidebarPlugin, ContentHandler} from "./sidebar/sidebar.js";
import {userPlugin} from "./sidebar/plugins/plugin-user";

$(document).ready (function () {
    var lidlRTO = window.lidlRTO;
    var phone = window.matchMedia("only screen and (max-width: 50em)");
    var tablet = window.matchMedia("only screen and (min-width: 50em) and (max-width: 75em)");

    // window.DockerElement = new docker.Docker(window.dockerArgs);
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
});