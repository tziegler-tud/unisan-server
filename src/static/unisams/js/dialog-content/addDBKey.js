(function (common,$,undefined) {
    (function (dialogContent, $, undefined) {
        (function (addDBKey, $, undefined) {

            /**
             *
             * Constructor for addDBKey item. Extends DialogContent.
             *
             * @param {String} containerSelector valid jQuery selector
             * @param {Object} content JSON
             * @param {String} userid id of user to be modified
             * @returns {addDBKey}
             */

            addDBKey.AddDBKey = function (containerSelector, content, userid) {

                self = this;
                dialogContent.DialogContent.call(this, containerSelector,content);

                createHTMLContent(this);

                return this;
            };

            var createHTMLContent = function(self){
                getUserDataFromServer(userid,function(context){
                    $.get('/static/unisams/js/templates/addDBKey-dialog.hbs', function (data) {
                        var template = Handlebars.compile(data);
                        self.htmlContainer.html(template(context));
                    });
                })
            };

            var getUserDataFromServer  = function(userid, callback){

                // get user data from server
                $.ajax({
                    url: "/unisams/usermod/" + userid,
                    type: 'GET',
                    cache: false,
                    isModified: false,
                    success: callback,
                });
            };

            var saveKeyToServer = function(){

                var data = {};

                $.ajax({
                    url: "/unisams/usermod/updateKey/" + userid,
                    type: 'PUT',
                    data: data,
                    cache: false,
                    isModified: false,
                    success: callback,
                });
            };

            return addDBKey;

        }(dialogContent.addDBKey = dialogContent.addDBKey || {}, jQuery));
    }(common.DialogContent = common.DialogContent || {}, jQuery));
}(window.common = window.common || {}, jQuery));