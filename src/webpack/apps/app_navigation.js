import "./app_navigation.scss";

import {MDCList} from "@material/list";
import {MDCTopAppBar} from "@material/top-app-bar";
import {MDCDrawer} from "@material/drawer";
import {MDCRipple} from "@material/ripple";

import {phone, tablet} from "../helpers/variables";


/**
 *
 * @param context
 * @param version
 * @returns {Navigation}
 * @constructor
 */
var Navigation = function(context, version){
    let self = this;
    let url;
    switch (version) {
        case "public":
            url = '/webpack/apps/templates/navigation_public.hbs'
            break
        default:
            url = '/webpack/apps/templates/navigation.hbs'
    }
    //load drawer template and attach to body
    self.initialize = $.get(url, function (data) {
        var template = Handlebars.compile(data);
        // $(".app-drawer-container").prepend(template(context));
        $(".app-page-wrapper").prepend(template(context));
        // const list = MDCList.attachTo(document.querySelector('.mdc-list'));
        // list.wrapFocus = true;
        const topAppBarElement = document.querySelector('.mdc-top-app-bar');
        const topAppBar =  new MDCTopAppBar(topAppBarElement);
        const drawer = MDCDrawer.attachTo(document.querySelector('.mdc-drawer'))
        const listEl = document.querySelector('.mdc-drawer .mdc-list');
        const mainContentEl = document.querySelector('.app-content-container');
        listEl.addEventListener('click', (event) => {
            // mainContentEl.querySelector('input, button').focus();
        });

        document.body.addEventListener('MDCDrawer:closed', () => {
            // mainContentEl.querySelector('input, button').focus();
        });
        // const buttonRipple = new MDCRipple(document.querySelector('.mdc-button'));

        topAppBar.setScrollTarget(mainContentEl);
        topAppBar.listen('MDCTopAppBar:nav', () => {
            drawer.open = !drawer.open;
        });

        if(!phone.matches) {
            //open drawer intially on desktop screen sizes
            drawer.open = true;
        }

        self.drawer = drawer;
        self.topAppBar = topAppBar;

        self.adjustWrapper(topAppBar);
        $(window).on('resize',function(){
            self.adjustWrapper(topAppBar);
        });
    });
    return self;
}

Navigation.prototype.adjustWrapper = function(topAppBar){
    //get viewport height
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    //get height of top navigation and topbar element
    let navHeight = topAppBar.foundation.adapter.getTopAppBarHeight();
    $(".app-content-container").css({
        height: (vh - navHeight) + "px",
        "padding-top": navHeight + "px"
    })
}
export{Navigation}