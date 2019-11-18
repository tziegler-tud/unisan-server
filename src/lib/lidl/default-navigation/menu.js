(function (lidl,$,undefined) {
    (function (nav,$,undefined) {
        (function (navComponent,$,undefined) {
            (function (menu,$,undefined) {

                /*imports*/
                var Hammer = window.Hammer;

                /*config variables*/
                var debug = false;



                /*private variables*/
                var state;
                var isUnique;
                var defaultState;

                /**
                 * Menu.
                 *
                 * @abstract
                 *
                 *
                 * @param domId {string} Id of the DOM Element

                 * @constructor
                 */

                menu.Menu = function(domId){
                    /*error if called directly*/
                    navComponent.NavComponent.call(this, domId,true,false);

                };
                menu.Menu.prototype = Object.create(navComponent.NavComponent.prototype, {
                    'constructor': menu.Menu
                });

                menu.Menu.prototype.init = function(){

                };

                menu.Menu.prototype.activate = function(){
                    this.ref.classList.add("menu-transition");
                    this.ref.classList.add("menu-active");
                };
                menu.Menu.prototype.deactivate = function(){
                    this.ref.classList.remove("menu-active");
                };
                menu.Menu.prototype.toggle = function(){
                    if(this.state){
                        this.setState(false);
                    }
                    else {
                        this.setState(true);
                    }
                };

                return menu;
            }(navComponent.menu = navComponent.menu || {}, jQuery));
        }(nav.navComponent = nav.navComponent || {}, jQuery));
    }(lidl.nav = window.lidl.nav || {}, jQuery));
}(lidl = window.lidl || {},jQuery));
