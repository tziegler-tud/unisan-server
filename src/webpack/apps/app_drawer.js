import {MDCList} from "@material/list";

(function (app,$,undefined) {

    app.Drawer = function(context){
        let self = this;
        //load drawer template and attach to body
        self.initialize = $.get('/static/unisams/js/apps/templates/drawer.hbs', function (data) {
            var template = Handlebars.compile(data);
            // $(".app-drawer-container").prepend(template(context));
            $(".app-drawer-container").prepend(template(context));
            const list = MDCList.attachTo(document.querySelector('.mdc-list'));
            list.wrapFocus = true;
        });
        return self;
    }



}(window.app = window.app || {}, jQuery));