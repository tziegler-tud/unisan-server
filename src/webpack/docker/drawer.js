import {MDCDrawer} from "@material/drawer";

import "./drawer.scss";
const Handlebars = require("handlebars");

var Drawer = function(context){
    var drawer;
    //load drawer template and attach to body
    return $.get('/webpack/docker/templates/drawer.hbs', function (data) {
        var template = Handlebars.compile(data);
        $("body").prepend(template(context));
        drawer = MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
        const listEl = document.querySelector('.mdc-drawer .mdc-deprecated-list');
        const mainContentEl = document.querySelector('#outer-wrapper');

        listEl.addEventListener('click', (event) => {
            drawer.open = false;
        });

        const settingsButton = document.getElementById("drawer-settings-button");
        settingsButton.addEventListener('click', (event) => {
            window.location = "/settings";
        });

        document.body.addEventListener('MDCDrawer:closed', () => {
            // mainContentEl.querySelector('input, button').focus();
        });
        window.drawer = drawer;
    });
}

export{Drawer}