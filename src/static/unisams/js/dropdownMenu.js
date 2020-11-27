(function (common,$,undefined) {

    /**
     *
     * Dropdown menu constructor.
     *
     *
     * @param {String} targetSelector jquery selector to add the classes when triggered. Usually, this is the container element of your menu.
     * @param {String} [eventType = "click"] type of event to attach to the trigger. Jquery event types valid, e.g. "click", "hover", etc...
     * @param {String} [triggerSelector= targetSelector] jquery selector for element(s) to register the event handler on.
     * @param {Object} [args] JSON containing strings to pass as optional args. valid keys are: "classes" - addtionial classes to add to the target when triggered, whitespace seperated.
     * @returns {common.DropdownMenu}
     * @constructor
     */
    common.DropdownMenu = function(targetSelector, eventType, triggerSelector, args){

        this.containerSelector = targetSelector;
        this.eventType = typeof(eventType) === "undefined" ? "click" : eventType;
        this.args = typeof(args) === "undefined" ? {} : args;
        this.triggerSelector = typeof(triggerSelector)=== "undefined" ? targetSelector : triggerSelector;

        init(this);

        return this;
    };

    var init = function(self) {
        let container = $(self.containerSelector);
        let trigger = $(self.triggerSelector);
        lidl.assert(container);
        lidl.assert(trigger);

        self.container = container;
        self.trigger = trigger;

        trigger.each(function(){
            registerEvent(self, self.eventType, trigger);
        });

    };

    var registerEvent = function (self, eventType, target) {
        $(target).on(eventType, function(){
            $(self.container).toggleClass("dropdown-active");
            if(self.args.classes){
                $(self.container).toggleClass(self.args.classes);
            }
            $(document).on("click", function(event) {
                //if you click on anything except the modal itself or the "open modal" link, close the modal
                if (!($(event.target).closest(self.container).length || ($(event.target).closest(self.trigger).length))) {
                    $(self.container).removeClass("dropdown-active");
                    if (self.args.classes) {
                        $(this).removeClass(self.args.classes);
                    }
                    $(this).off("click");
                }
            });
        });
    };

    return common.DropdownMenu;



}(window.common = window.common || {}, jQuery));