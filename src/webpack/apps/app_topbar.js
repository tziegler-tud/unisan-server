import {MDCTopAppBar} from '@material/top-app-bar';

(function (app,$,undefined) {

    app.Topbar = function(context, callback){
        var drawer;
        let self = this;
        if (callback === undefined) callback = {}
        this.callback = callback;
        //load drawer template and attach to body
        this.initialize = $.get('/static/unisams/js/apps/templates/topbar.hbs', function (data) {
            var template = Handlebars.compile(data);
            $("body").prepend(template(context));
            const topAppBarElement = document.querySelector('.mdc-top-app-bar');
            const topAppBar =  new MDCTopAppBar(topAppBarElement);
            self.adjustWrapper(topAppBar);
            $(window).on('resize',function(){
                self.adjustWrapper(topAppBar);
            });
        });
        return this;
    }

    app.Topbar.prototype.adjustWrapper = function(topAppBar){
        //get viewport height
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        //get height of top navigation and topbar element
        let navHeight = topAppBar.foundation.adapter.getTopAppBarHeight();
        $("#wrapper").css({
            height: (vh - navHeight) + "px",
            "padding-top": navHeight + "px"
        })
    }



}(window.app = window.app || {}, jQuery));