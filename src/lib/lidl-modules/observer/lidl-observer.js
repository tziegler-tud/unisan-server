/**
 *
 *
 *
 *
 *
 * @author: Tom Ziegler
 * @version: 0.2mod
 *
 *
 * @namespace lidl
 *
 *
 *************/

/**
 *
 * Constructor of observer

 * @constructor
 * @class
 *
 */

var Observer = function (updateFunc) {
    this.updateFunc = updateFunc;
    return this;
};

Observer.prototype.update = function(args){
  this.updateFunc(args);
};

export{Observer}