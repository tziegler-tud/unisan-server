(function (common,$,undefined) {
    (function (dialogContent, $, undefined)
    {
        /**
         *
         * @param containerSelector
         * @param content
         *
         * @constructor
         * @abstract
         */

        dialogContent.DialogContent = function (containerSelector, content) {
            /*error if called directly*/
            if (this.constructor === dialogContent.DialogContent) {
                throw new Error('Cannot instanciate abstract class.');
            }

            this.ref = $(containerSelector);
            this.content = content;
            this.htmlContainer = createHTMLContainer(this);
            try{
                lidl.assert(this.ref,debug);
            }
            catch(e){
                throw new Error("Failed to initialize container with jquery selector " + containerSelector +" with error: "+ e);
            }

            return this;
        };

        var createHTMLContainer = function(self){

            return $('<div/>', {
                id: "addDBKey-dialog-container",
                class: "addDBKey-container",

            });
        };


        return dialogContent;


    }(common.DialogContent = common.DialogContent || {}, jQuery));
}(window.common = window.common || {}, jQuery));