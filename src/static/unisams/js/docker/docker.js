(function (docker, $, undefined) {

    /**
     * @namespace: docker
     */


    var phone = window.matchMedia("only screen and (max-width: 50em)");


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
     * @returns {Docker}
     */
    docker.Docker = function(dockerArgs){

        dockerArgs = applyArgs(dockerArgs);
        this.dockerArgs = dockerArgs;
        this.observers = [];

        //find docker-container dom element.
        this.wrapper = document.getElementById(dockerArgs.containerSelector);

        this.topBarHeight = 100; //default

        // build templating context
        let context = {};
        let self = this;
        // render container template

        //promise resolved when DOM elements are build
        $.get('/static/unisams/js/docker/templates/docker-container.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.wrapper.innerHTML = template(context);
            self.innerContainer = document.getElementById("docker-inner");

            // create new observer
            var observer = new lidl.Observer(function(user){
                window.currentExploredUser = user;
            });

            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            window.currentUserProfile.getUserAndSubscribe(observer)
                .then(function(user){
                    buildDocker(user)
                })
                .catch(function(reason){
                    console.error("Failed to retrieve user data:" + reason)
                });

            var buildDocker = function(user){
                var domElementsPromise = new Promise(function(){});
                //render docker content depending on device
                //desktop/tablet: render static docker
                if(!phone.matches) {
                    domElementsPromise = $.get('/static/unisams/js/docker/templates/docker-desktop.hbs', function (data) {
                        var template = Handlebars.compile(data);
                        $(self.innerContainer).append(template(context));
                    });
                }
                else {
                    domElementsPromise = new common.Drawer({user: user});
                    //enable drawer
                    document.getElementById("docker-top-btn").addEventListener("click", function() {
                        window.drawer.open = !window.drawer.open;
                    })

                }
                domElementsPromise.then(function(){
                    let topBarElement = $(self.innerContainer).find("#docker-top").first();
                    self.topBarHeight = $(topBarElement).innerHeight();
                    //initially setup dom elements
                    const container = document.getElementById(dockerArgs.activeContainer);
                    const el = document.getElementById(dockerArgs.activeElementId);
                    if (el) activateElement(container, el);

                    self.elementContainer = findElementContainer();
                    initEventHandlers(self);

                    //enable subpages
                    self.subpagesEnabled = true;
                    self.ready = true;
                    self.resolveObserver(true);
                })
                    .catch(function(){
                        console.error("failed to create drawer");
                        rejectReady();
                    })
            }
        });

        this.subpageHandler = {
            counter: {
                value: 0,
                increase: function(){
                    this.value++;
                    return this.value;
                }
            },
            subpages: [],
            findById: function(id){
                return this.subpages.find(e => e.id === id);
            },
            add: function(subpage){
                this.subpages.push(subpage);
            },
            remove: function(id){
                let index = this.subpages.findIndex(e=> e.id === id);
                this.subpages.splice(index, 1);
                return id;
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
            /**
             * regenerates the subpage with new data
             * @param id - subpage id
             * @param type - see signature of addDockerSubpage method
             * @param data - see signature of addDockerSubpage method
             */
            update: function(id, type, data){
                self.addDockerSubPage(type, data, {overwrite: true}, id)
            },
            generateId: function(){
                return "docker-subpage_" + this.counter.increase();
            }

        }

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
            // might prove better to use state module pattern if this grows.
            // e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            // find container TODO: do not use jquery
            let container = $(e.currentTarget).parent(".docker-elementContainer")[0];

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
            // might prove better to use state module pattern if this grows.
            e.stopImmediatePropagation();
            e.preventDefault();

            // find container TODO: do not use jquery
            let container = $(e.currentTarget).parent(".docker-elementContainer")[0];

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

    /**
     *
     * @param args
     */
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
     * adds a subpage to docker
     * @param {String} type - type of subpage. this value determines which template is used
     * @param {Object} data - JSON containing data for template rendering
     * @param {Object} options - overwrite [bool]: replace existing subpages if id matches
     * @param {Number} [id] - (Optional) set id for the new subpage. Fails if id exists without the overwrite option
     * @returns {*}
     */
    docker.Docker.prototype.addDockerSubPage = function(type, data, options, id){
        var self = this;
        if (options === undefined) options = {overwrite: false};
        // build context
        var context = {};

        //generate subpageId if none was provided
        if (id === undefined) {
            id = self.subpageHandler.generateId();
        }
        else {
            if (self.subpageHandler.findById(id) !== undefined){
                //without overwrite, fail
                if (!options.overwrite) {
                    throw new Error("Error (docker.js): Cannot replace existing subpages without overwrite option.");
                }
                //with overwrite, replace current subpage with new one
                else {
                    self.subpageHandler.remove(id);
                }
            }
            //else: id does not exist, continue
        }

        var subpage = {
            id: id,
            type: type,
            isActive: false,
        }

        self.subpageHandler.add(subpage);

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
                self.subpageHandler.show(id);
                //initially setup dom elements
                const container = document.getElementById(dockerArgs.activeContainer);
                const el = document.getElementById(dockerArgs.activeElementId);
                if(el) activateElement(container, el);
            })
            .catch()
        }

        return id;
    };

    docker.Docker.prototype.getTopBarHeight = function(){
        return this.topBarHeight;
    };


    return docker;

}(window.docker = window.docker||{}, jQuery, undefined));