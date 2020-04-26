(function (sidebar,$,undefined) {
    (function (sidebarPlugin,$,undefined) {
        /*imports*/
        var Hammer = window.Hammer;

        /*config variables*/
        var debug = false;



        /*private variables*/

        /**
         * SidebarPlugin.
         *
         * @abstract
         *
         *
         *
         * @constructor
         */

        sidebarPlugin.SidebarPlugin = function(){
            /*error if called directly*/
            if (this.constructor === sidebarPlugin.SidebarPlugin) {
                throw new Error('Cannot instanciate abstract class.');
            }


            /*public attributes*/

        };

        sidebarPlugin.SidebarPlugin.prototype.xxx = function(){

        };

        return sidebarPlugin;
    }(sidebar.sidebarPlugin = window.sidebar.sidebarPlugin || {}, jQuery));
}(sidebar = window.sidebar || {},jQuery));
