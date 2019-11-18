(function (lidl,$,undefined) {
    (function (nav,$,undefined) {
        (function (navComponent,$,undefined) {
            (function (navBar,$,undefined) {

            /*imports*/
            var Hammer = window.Hammer;

            /*config variables*/
            var debug = false;


            /*private variables*/
            var self;
            var state;
            var isUnique;
            var defaultState;
            var isDragging = false;


            /**
             * NavBar constructor.
             *
             * @abstract
             * @constructor
             *
             *
             * @param domId {string} Id of the DOM Element
             *
             */

            navBar.NavBar = function(domId){
                self = this;
                navComponent.NavComponent.call(this, domId,true,true);

                var mc = new Hammer.Manager(self.ref);
                mc.add(new Hammer.Pan({direction: Hammer.DIRECTION_DOWN, threshold: 20}));
                mc.on("pan", dragHandler);


            };
            navBar.NavBar.prototype = Object.create(navComponent.NavComponent.prototype, {
                'constructor': navBar.NavBar
            });

            navBar.NavBar.prototype.activate = function(){
                this.ref.classList.add("nav-active");
            };
            navBar.NavBar.prototype.deactivate = function(){
                this.ref.classList.remove("nav-active");
            };

            var dragHandler = function(ev){
                console.log("panning...");
                var lastPos = 0;
                var el = ev.target;

                if(!isDragging){
                    var s = el.style.top;
                    lastPos = parseInt(s.substr(0,s.length-2));
                }
                var pos = ev.deltaY + lastPos;
                self.setState(true);

                if (ev.isFinal) {
                    console.log("panning finished");
                    isDragging = false;
                }


            };



            return navBar;
            }(navComponent.navBar = navComponent.navBar || {}, jQuery));
        }(nav.navComponent = nav.navComponent || {}, jQuery));
    }(lidl.nav = window.lidl.nav || {}, jQuery));
}(lidl = window.lidl || {},jQuery));
