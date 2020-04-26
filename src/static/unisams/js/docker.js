(function (common, $, undefined) {

    common.Docker = function(args){
        if (args !== undefined) {
            applyArgs(this, args);
        }
        this.elementContainer = findElementContainer();
        initEventHandlers(this);

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

    const findElementContainer =  function(){
        return document.getElementsByClassName("docker-elementContainer");
    };

    const initEventHandlers = function(dockerInstance){

        const self = dockerInstance;
        //add onclick handlers to docker elements
        $(".docker-subElement").on('click', function(e) {
          //just follow link, nothing to do here for now
        });

        // clicks on mainElement shall expand container, second click should follow link
        $(".docker-mainElement").on('click', function(e) {
            // find container TODO: do not use jquery
            let container = $(e.currentTarget).parent(".docker-elementContainer")[0];

            // might prove better to use state module pattern if this grows.
            e.stopPropagation();
            e.preventDefault();
            // check if container is expanded
            if (container.classList.contains("expanded")) {
                // collaps it.
                collapseContainer(container);
            }
            else {
                //collaps all other expanded containers
                //never collaps active container
                for (let el of self.elementContainer){
                    if(el.id === container.id || !el.classList.contains("expanded") || el.classList.contains("docker-container-active")) continue;
                    collapseContainer(el);
                }
                // expand container
                expandContainer(container)
            }

        })
    };

    const collapseContainer = function (container) {
        // assume container is a htmlElement
        lidl.assertHTMLElement(container);
        // find subcontainer
        let subContainer = container.getElementsByClassName("docker-subElementContainer")[0];
        if (subContainer === undefined) return false;
        // get current height
        let currentHeight = subContainer.scrollHeight;
        // temporarily disable all css transitions


        // set container height to the current height
        requestAnimationFrame(function() {
            subContainer.style.height = currentHeight + 'px';

            // on the next frame, have the element transition to height: 0
            requestAnimationFrame(function() {
                subContainer.style.height = 0 + 'px';
                //apply class change. should work!
                container.classList.remove("expanded");
            });
        });
    };

    const expandContainer =  function (container) {
        // assume container is a htmlElement
        lidl.assertHTMLElement(container);
        // find subcontainer
        let subContainer = container.getElementsByClassName("docker-subElementContainer")[0];
        if (subContainer === undefined) return false;
        // get current height
        let currentHeight = subContainer.scrollHeight;
        // have the element transition to the height of its inner content
        subContainer.style.height = currentHeight + 'px';
        subContainer.addEventListener('transitionend', function(e) {
            // remove this event listener so it only gets triggered once
            subContainer.removeEventListener('transitionend', arguments.callee);
            // remove "height" from the element's inline styles, so it can return to its initial value
            subContainer.style.height = null;
        });
        // apply container class change.
        container.classList.add("expanded");
    };

    common.Docker.prototype.applyArgs = function(args){
        applyArgs(args)
    };

    common.Docker.prototype.activateElement = function (activeContainer, activeEl) {
        activeContainer.classList.add("docker-container-active");
        activeContainer.classList.add("expanded");

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