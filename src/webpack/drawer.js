import {MDCDrawer} from "@material/drawer";


(function (common,$,undefined) {

    common.Drawer = function(context){
        var drawer;
        //load drawer template and attach to body
        return $.get('/static/unisams/js/drawer/drawer.hbs', function (data) {
            var template = Handlebars.compile(data);
            $("body").prepend(template(context));
            drawer = MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
            const listEl = document.querySelector('.mdc-drawer .mdc-list');
            const mainContentEl = document.querySelector('#outer-wrapper');

            listEl.addEventListener('click', (event) => {
                drawer.open = false;
            });

            document.body.addEventListener('MDCDrawer:closed', () => {
                // mainContentEl.querySelector('input, button').focus();
            });
            window.drawer = drawer;
        });
    }

}(window.common = window.common || {}, jQuery));