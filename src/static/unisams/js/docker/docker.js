(function (docker, $, undefined) {

    /**
     * @namespace: docker
     */

    /**
     * typedef Constructor arguments
     * @typedef {Object} dockerArgs
     * @property {string} containerSelector - dom id matching the wrapper for the docker to be build inside
     * @property {string} activeContainer - dom id matching the currently active docker container element.
     * @property {string} activeElementId - dom id matching the currently active docker element.
     */


    /**
     * Constructor of Docker component.
     *
     *
     * @param dockerArgs {dockerArgs} JSON containing construcion arguments. See typedef.
     * // construct component from args. Note: dockerArgs is used here as substitute for constructor arguments. Should be improved, or this is gonna be painful to maintain later on.
     * // TODO: Make argument calls explicit and annotate
     * @constructor
     *
     * @returns Docker
     */


    docker.Docker = function(dockerArgs){

        dockerArgs = applyArgs(dockerArgs);
        this.dockerArgs = dockerArgs;

        //find docker-container dom element.
        this.wrapper = document.getElementById(dockerArgs.containerSelector);

        // build templating context
        let context = {};
        let self = this;
        // render template
        $.get('/static/unisams/js/docker/templates/docker.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.wrapper.innerHTML= template(context);

            //initially setup dom elements
            const container = document.getElementById(dockerArgs.activeContainer);
            const el = document.getElementById(dockerArgs.activeElementId);
            if(el) activateElement(container, el);

            this.elementContainer = findElementContainer();
            initEventHandlers(this);
        });

        return this;
    };

    var applyArgs = function(args){
        args = (args === undefined) ? {}: args;
        args.containerSelector = args.containerSelector !== undefined ? args.containerSelector : 'docker-wrapper';
        args.activeContainer = args.activeContainer !== undefined ? args.activeContainer : undefined;
        args.activeElementId = args.activeElementId !== undefined ? args.activeElementId : undefined;

        return args;
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

    const activateElement = function (activeContainer, activeEl) {
        activeContainer.classList.add("docker-container-active");
        activeContainer.classList.add("expanded");

        if (activeEl) {
            var containerDomElement = activeEl.parentElement;
            activeEl.classList.add("docker-element-active");
            containerDomElement.classList.add("docker-element-active");
        }
    };

    docker.Docker.prototype.applyArgs = function(args){
        applyArgs(args)
    };

    docker.Docker.prototype.activateElement = function (activeContainer, activeEl) {
        activateElement(activeContainer, activeEl);
    };

    docker.Docker.prototype.setActiveElementId = function(domId){
        if (typeof domId != "string") throw new TypeError('argument ’domId’ is not a string');
        this.activeElementId = domId;
    };

    docker.Docker.prototype.getActiveElementId = function(){
        return this.activeElementId;
    };

    /**
     * adds a subpage to the docker
     */
    docker.Docker.prototype.addDockerSubPage = function(){
        // testing. lets just render the user subpage
        var self = this;
        // build context
        var context = {};

        // var wrapper = document.getElementById("docker-content");
        //
        // $.get('/static/unisams/js/docker/templates/subpage-user.hbs', function (data) {
        //     var template = Handlebars.compile(data);
        //     wrapper.innerHTML= template(context);
        //
        //     //initially setup dom elements
        //     const container = document.getElementById(dockerArgs.activeContainer);
        //     const el = document.getElementById(dockerArgs.activeElementId);
        //
        //     this.elementContainer = findElementContainer();
        //
        //});
    };

    return docker;

}(window.docker = window.docker||{}, jQuery, undefined));