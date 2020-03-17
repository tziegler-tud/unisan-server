(function (common, $, undefined) {

    common.Docker = function(args){
        if (args !== undefined) {
            applyArgs(this, args);
        }
    };

    var applyArgs = function(self, args){
        self.args = typeof args !='undefined' ? args : {};
        self.args.containerSelector = typeof self.args.containerSelector != 'undefined' ? self.args.containerSelector : undefined;
        self.args.activeContainer = typeof self.args.activeContainer != 'undefined' ? self.args.activeContainer : undefined;
        self.args.activeElementId = typeof self.args.activeElementId != 'undefined' ? self.args.activeElementId : undefined;
        const container = document.getElementById(self.args.activeContainer);
        const el = document.getElementById(self.args.activeElementId);
        if(el) self.activateElement(container, el)
    };

    common.Docker.prototype.applyArgs = function(args){
        applyArgs(args)
    };

    common.Docker.prototype.activateElement = function (activeContainer, activeEl) {
        activeContainer.classList.add("docker-container-active");

        if (activeEl) {
            var containerDomElement = activeEl.parentElement;
            activeEl.classList.add("docker-element-active");
            containerDomElement.classList.add("docker-element-active");
        }
    };

    common.Docker.prototype.setActiveElementId = function(domId){
        if (typeof domId != "string") throw new TypeError('argument ’domId’ is not a string');
        this.activeElementId = domId;

    };

    common.Docker.prototype.getActiveElementId = function(){
        return this.activeElementId;
    };

    return common.Docker();

}(window.common = window.common || {}, jQuery));