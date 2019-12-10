/**
 *
 *
 *
 *
 *
 * @author: Tom Ziegler
 * @version: 0.1b
 *
 *
 * @namespace lidl
 *
 *
 *************/



(function (lidl,$,undefined) {

    /**
     *
     * Constructor of button object

     * @constructor
     * @class
     *
     */

    lidl.Buttongroup = function (token) {
        this.token = token;

        this.buttonList = [];
    };


    lidl.Buttongroup.prototype.addButton = function(button){
        var self = this;
        button.on("click", self.toggle());
        this.buttonList.add(button);
    };

    lidl.Buttongroup.prototype.toggle = function (){
        $(this.buttonList).each(function(){
            this.toggle();
        })
    }


}(lidl = window.lidl || {},jQuery));