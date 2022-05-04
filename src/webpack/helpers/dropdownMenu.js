import {Corner, MDCMenu} from '@material/menu';
import "./dropdownMenu.scss"

/**
 *
 * Dropdown menu constructor.
 *
 *
 * @param {String} container Container element housing the mdc domtree. This should be a wrapper of the actual mdc menu
 * @param {String} [eventType = "click"] type of event to attach to the trigger. Jquery event types valid, e.g. "click", "hover", etc...
 * @param {String} [triggerSelector= targetSelector] jquery selector for element(s) to register the event handler on.
 * @param {Object} [args] JSON containing strings to pass as optional args. valid keys are: "classes" - addtionial classes to add to the target when triggered, whitespace seperated.
 * @returns {common.DropdownMenu}
 * @constructor
 */
var DropdownMenu = function(container, eventType, triggerSelector, args){

    args = args === undefined ? {} : args;
    this.args = applyArgs(args);
    this.containerSelector = container;
    this.eventType = typeof(eventType) === "undefined" ? "click" : eventType;
    this.triggerSelector = triggerSelector === undefined ? container : triggerSelector;
    this.enabled = this.args.enabled;

    this.init();

    return this;
};

DropdownMenu.prototype.disable = function(){
    this.enabled = false;
}

DropdownMenu.prototype.enable = function(){
    this.enabled = false;
}

DropdownMenu.prototype.open = function(){

}

var applyArgs = function(args){
    let defaultArgs = {
        classes: "",
        enabled: true,
        anchorCorner: Corner.BOTTOM_LEFT,
        fixed: false,
    }
    args = (args === undefined) ? {}: args;
    return Object.assign(defaultArgs, args);
}

DropdownMenu.prototype.init = function() {
    let self = this;
    let container = $(self.containerSelector);
    let trigger = $(self.triggerSelector);

    self.container = container;
    self.trigger = trigger;

    //find mdc container
    let menuElement = $(container).find(".mdc-menu")[0];
    self.menu = new MDCMenu(menuElement);
    self.menu.setAnchorCorner(self.args.anchorCorner);

    if(self.args.fixed) {
        self.menu.setFixedPosition(true);
    }

    trigger.each(function(){
        registerEvent(self, self.eventType, trigger);
    });

};

var registerEvent = function (self, eventType, target) {
    $(target).on(eventType, function(e){
        e.stopPropagation();
        if(self.args.classes){
            $(self.container).toggleClass(self.args.classes);
        }
        self.menu.open = true;
    });
};

export{DropdownMenu, Corner}