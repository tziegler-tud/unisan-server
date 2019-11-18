(function (lidl,$,undefined) {
    (function (nav,$,undefined) {
        (function (navComponent,$,undefined) {

            /*imports*/
            var Hammer = window.Hammer;

            /*config variables*/
            var debug = false;



            /*private variables*/

            /**
             * NavComponent.
             *
             * @abstract
             *
             *
             * @param domId {string} Id of the DOM Element
             * @param isUnique {boolean} true if only one instance of this class is allowed.
             * @param defaultState {boolean} the default state for the component
             * @constructor
             */

            navComponent.NavComponent = function(domId,isUnique,defaultState){
                /*error if called directly*/
                if (this.constructor === navComponent.NavComponent) {
                    throw new Error('Cannot instanciate abstract class.');
                }


                /*public attributes*/
                this.ref = document.getElementById(domId);
                this.isUnique = isUnique;
                this.state = defaultState;
                this.init();


                /*test ref for validity */
                try{
                    lidl.assertHTMLElement(this.ref,debug);
                }
                catch(e){
                    throw new Error("Failed to initialize DOM Element with Id: " + domId +" with error: "+ e);
                }

            };
            navComponent.NavComponent.prototype.init = function(){};

            navComponent.NavComponent.prototype.getState = function(){
                return this.state;
            };
            navComponent.NavComponent.prototype.setState = function(newstate){
                if (newstate) {
                    this.activate();
                }
                else {
                    this.deactivate();
                }
                this.state = newstate;
                return this.state;
            };
            navComponent.NavComponent.prototype.getHeight = function(){
                return this.ref.offsetHeight;
            };
            navComponent.NavComponent.prototype.activate = function(){
                throw new Error('Cannot call abstract method');
            };
            navComponent.NavComponent.prototype.deactivate = function(){
                throw new Error('Cannot call abstract method');
            };

            return navComponent;
        }(nav.navComponent = nav.navComponent || {}, jQuery));
    }(lidl.nav = window.lidl.nav || {}, jQuery));
}(lidl = window.lidl || {},jQuery));
