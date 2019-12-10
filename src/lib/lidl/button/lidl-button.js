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

    lidl.Button = function (token, buttonDomSelector, args) {
        this.token = token;
        this.element = typeof(buttonDomSelector) === "string" ? $(buttonDomSelector).first() : buttonDomSelector;
        this.args = args;

        this.enableStateModule = new EnableStateModule(this);

        this.enabled = this.enableStateModule.setState(args.enabled);
        this.callback = typeof(args.callback) === 'undefined' ? undefined : args.callback;



        return this;
    };


    /**
     *
     * adds an event listener to the button object
     *
     * @param trigger PlainObject on or more jquery event keywords ('click', 'mouseover',...)
     * @param action Function function for the given triggers.
     *
     */
    lidl.Button.prototype.addAction = function(trigger, action){
        var self = this;
        return $(this.element).on(trigger, function(){
            if(self.enableStateModule.getState()) {
                action()
            }
        });
    };

    lidl.Button.prototype.removeActions = function(trigger) {
        $(this.element).off(trigger);

    };

    lidl.Button.prototype.disable = function(){
        //enable(this, false);
        this.enableStateModule.setState(false);
    };

    lidl.Button.prototype.enable = function(){
        // enable(this, true);
        this.enableStateModule.setState(true);
    };


    var enable = function(self, bool){

        $(self.element).removeClass("lidl-button-disabled");
        $(self.element).addClass("lidl-button-enabled");
        if (self.args.classes){
            $(self.element).removeClass(self.args.classes.onDisabeld);
            $(self.element).addClass(self.args.classes.onEnabled);
        }
        return true;
    };

    var disable = function(self) {
        $(self.element).removeClass("lidl-button-enabled");
        $(self.element).addClass("lidl-button-disabled");
        if (self.args.classes){
            $(self.element).addClass(self.args.classes.onDisabeld);
            $(self.element).removeClass(self.args.classes.onEnabled);
        }
        self.enabled = false;
        return false;
    };

    var EnableStateModule = function(ref){
        var state = false;
        var EnableState = {
            self: ref
        };


        EnableState.setState = function (newstate) {

            if (newstate) {
                enable(EnableState.self);
            }
            else {
                disable(EnableState.self);
            }
            state = newstate;
        };
        EnableState.getState = function () {
            return state;
        };

        EnableState.toggleState = function(){
            this.setState(!state);
        };
        return EnableState;
    };


}(lidl = window.lidl || {},jQuery));