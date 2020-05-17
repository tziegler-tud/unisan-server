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
     * Constructor of observer

     * @constructor
     * @class
     *
     */

    lidl.Observer = function (updateFunc) {
        this.updateFunc = updateFunc;
        return this;
    };

    lidl.Observer.prototype.update = function(args){
      this.updateFunc(args);
    };

    return lidl;


}(lidl = window.lidl || {},jQuery));