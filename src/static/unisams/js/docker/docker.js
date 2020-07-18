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
        this.observers = [];

        //find docker-container dom element.
        this.wrapper = document.getElementById(dockerArgs.containerSelector);

        // build templating context
        let context = {};
        let self = this;
        // render template
        $.get('/static/unisams/js/docker/templates/docker-container.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.wrapper.innerHTML= template(context);

            //initially setup dom elements
            const container = document.getElementById(dockerArgs.activeContainer);
            const el = document.getElementById(dockerArgs.activeElementId);
            if(el) activateElement(container, el);

            self.elementContainer = findElementContainer();
            initEventHandlers(self);

            //enable subpages
            self.subpagesEnabled = true;
            self.ready = true;
            self.resolveObserver(true);
        });
        return this;
    };

    docker.Docker.prototype.resolveObserver = function(payload){
      this.observers.forEach(function(ob){
          ob.resolve(payload);
      })
    };

    docker.Docker.prototype.addObserver = function(obj){
      this.observers.push(obj)
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
                    if(el.id === container.id || !el.classList.contains("expanded") || el.classList.contains("docker-container-active") || !el.classList.contains("collapsing")) continue;
                    collapseContainer(el);
                }
                // expand container
                expandContainer(container)
            }

        })
    };

    /**
     *
     * sets up event handlers for the new subpage without compromising existing ones.
     *
     * @param dockerInstance {docker} the docker instance
     * @param subpage {HTMLElement} the subpage dom element
     * @param activate {Boolean} renders the subpage the active container
     */

    const addSubpageEventHandlers = function(dockerInstance, subpage, activate){

        const self = dockerInstance;
        //add onclick handlers to docker elements
        $(subpage).find($(".docker-subElement")).on('click', function(e) {
            //just follow link, nothing to do here for now
        });

        // clicks on mainElement shall expand container, second click should follow link
        $(subpage).find($(".docker-mainElement")).on('click', function(e) {
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
                // collaps only containers with class "collapsing"
                for (let el of self.elementContainer){
                    if(el.id === container.id || !el.classList.contains("expanded") || el.classList.contains("docker-container-active") || !el.classList.contains("collapsing")) continue;
                    collapseContainer(el);
                }
                // expand container
                expandContainer(container)
            }

        })
        //currently done via hbs template class assignment
        // if (activate) {
        //
        // }
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

    docker.Docker.prototype.notifyWhenReady = function(target){
        var self = this;
        return new Promise(function(resolve,reject){
            if (self.ready){
                resolve();
            }
            else {
                //wait for docker to build dom
                //add promise
                var p = {
                    resolve: function(){
                      resolve();
                    },
                    reject: function(){
                        reject();
                    },
                }
                self.addObserver(p);
            }
        })
    };

    /**
     * adds a subpage to the docker
     */
    docker.Docker.prototype.addDockerSubPage = function(type, data){
        // testing. lets just render the user subpage
        var self = this;
        // build context
        var context = {};

        //generate subpageId
        var id = subpageHandler.generateId();

        var subpage = {
            id: id,
            isActive: false,
        }

        subpageHandler.add(subpage);

        let url;
        switch(type){
            case "user":
                url = '/static/unisams/js/docker/templates/subpage-user.hbs';
                context = {
                    id: id,
                    exploredUser: data,
                };
                break;
            case "event":
                url = '/static/unisams/js/docker/templates/subpage-event.hbs';
                context = {
                    id: id,
                    exploredEvent: data,
                };
                break;
        }
        $.get(url, function (data) {
            let template = Handlebars.compile(data);
            appendContent(template, context)
        });

        function appendContent(template, context) {
        self.notifyWhenReady()
            .then(function() {
                var subpageContainer = document.getElementById("docker-subPage-container");
                subpageContainer.innerHTML= template(context);
                const subpageDom = document.getElementById(id);
                addSubpageEventHandlers(self, subpageDom, true);
                subpageHandler.show(id);
                //initially setup dom elements
                const container = document.getElementById(dockerArgs.activeContainer);
                const el = document.getElementById(dockerArgs.activeElementId);
                if(el) activateElement(container, el);
            })
            .catch()
        }

        return id;
    };

    var subpageHandler = {
        counter: {
            value: 0,
            increase: function(){
                this.value++;
                return this.value;
            }
        },
        subpages: [],
        findById: function(){
            console.warn("not implemented");
        },
        add: function(subpage){
            this.subpages.push(subpage);
        },
        show: function(id){
            let page = this.findById(id);
            //add css class to page
            let dom = document.getElementById(id);
            dom.classList.add("subpage-active");
        },
        hide: function(id){
            let page = this.findById(id);
            //add css class to page
            let dom = document.getElementById(id);
            dom.classList.remove("subpage-active");
        },
        generateId: function(){
            return "docker-subpage_" + this.counter.increase();
        }

    }



    return docker;

}(window.docker = window.docker||{}, jQuery, undefined));