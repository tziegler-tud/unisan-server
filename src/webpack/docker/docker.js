import {Drawer} from "./drawer"
import "./docker.scss";
import SubpageHandler from "./SubpageHandler";
import {lidl} from "/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
const Handlebars = require("handlebars");

var phone = window.matchMedia("only screen and (max-width: 50em)");


/**
 * @class Docker
 */
export default class Docker{
    /**
     *
     * @param {String} containerSelector - dom id matching the wrapper for the docker to be build inside
     * @param {String} activeContainer - dom id matching the currently active docker container element.
     * @param {String} activeElementId - dom id matching the currently active docker element.
     * @param {Object} context - json object passed to the templating engine
     * @param [Number=100] topBarHeight
     */
    constructor({
                    containerSelector='docker-wrapper',
                    activeContainer,
                    activeElementId,
                    context={},
                    topBarHeight = 100,
        }={}) {

        this.containerSelector = containerSelector;
        this.activeContainer = activeContainer;
        this.activeElementId = activeElementId;
        this.dockerContext = context;
        this.topBarHeight = topBarHeight;

        this.observers = [];

        //find docker-container dom element.
        this.wrapper = document.getElementById(this.containerSelector);
        if(!this.wrapper) {
            throw new Error("Failed to initiate docker: Could not find container")
        }

        this.dockerAcl = {}

        // build templating context
        this.context = {
            docker: {},
            dockerContext: this.dockerContext,
        }
        // render container template
        //promise resolved when DOM elements are build
        $.get('/webpack/docker/templates/docker-container.hbs', (data) => {
            var template = Handlebars.compile(data);
            this.wrapper.innerHTML = template(this.context);
            this.innerContainer = document.getElementById("docker-inner");

            // create new observer
            var observer = new lidlObserver((user) => {
                window.currentExploredUser = user;
            });

            // get user data from user service
            //subscribe as observer to get notification if user changes on server
            window.currentUserProfile.getUserAndSubscribe(observer)
                .then((user) => {
                    this.buildDocker(user)
                })
                .catch((reason) => {
                    console.error("Failed to retrieve user data:" + reason)
                });
        });

        this.subpageHandler = new SubpageHandler(this);
    }

    buildDocker(user) {
        //get user acl
        let aclPromise = $.get("/api/v1/acl/current");

        aclPromise
            .then((userACL) => {
                this.dockerAcl = userACL.docker;
                this.context.docker = userACL.docker;
                this.context.user = user;

                let domElementsPromise = new Promise((resolve, reject) => {});
                //render docker content depending on device
                //desktop/tablet: render static docker
                if(!phone.matches) {
                    domElementsPromise = $.get('/webpack/docker/templates/docker-desktop.hbs')
                }
                else {
                    domElementsPromise = new Drawer(this.context);
                }
                domElementsPromise.then(domElements => {
                    if(!phone.matches) {
                        var template = Handlebars.compile(domElements);
                        $(this.innerContainer).append(template(this.context));
                    }
                    else {
                        //enable drawer
                        document.getElementById("docker-top-btn").addEventListener("click", function() {
                            window.drawer.open = !window.drawer.open;
                        })
                    }
                    let topBarElement = $(this.innerContainer).find("#docker-top").first();
                    this.topBarHeight = $(topBarElement).innerHeight();
                    //initially setup dom elements
                    const container = document.getElementById(this.activeContainer);
                    const el = document.getElementById(this.activeElementId);
                    if (el) this.activateElement(container, el);

                    this.elementContainer = document.getElementsByClassName("docker-elementContainer");
                    this.initEventHandlers();

                    //enable subpages
                    this.subpagesEnabled = true;
                    this.ready = true;
                    this.resolveObserver(true);

                    //add system settings subpage to all users for now
                    //TODO: settings subpage should only be visible for users with appropriate access rights
                    if(this.dockerAcl.system.enabled) {
                        this.addDockerSubPage("system", {id: "DockerSystemContainer"}, {position: {place: "first"}}, undefined, userACL.docker)
                    }

                })
            })
            .catch(function(){
                console.error("failed to create drawer");
                //rejectReady();
            })
    }

    resolveObserver(payload){
        this.observers.forEach(function(ob){
            ob.resolve(payload);
        })
    };

    addObserver(obj){
        this.observers.push(obj)
    };


    initEventHandlers (){
        //add onclick handlers to docker elements
        $(".docker-subElement").on('click', function(e) {
            //just follow link, nothing to do here for now
        });

        // clicks on mainElement shall expand container, second click should follow link
        $(".docker-mainElement").on('click', (e) => {
            // might prove better to use state module pattern if this grows.
            // e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            // find container TODO: do not use jquery
            let container = $(e.currentTarget).parent(".docker-elementContainer")[0];

            // check if container is expanded
            if (container.classList.contains("expanded")) {
                // collaps it.
                this.collapseContainer(container);
            }
            else {
                //collaps all other expanded containers
                //never collaps active container
                for (const el of this.elementContainer){
                    if(el.id === container.id || !el.classList.contains("expanded") || el.classList.contains("docker-container-active") || !el.classList.contains("collapsing")) continue;
                    this.collapseContainer(el);
                }
                // expand container
                this.expandContainer(container)
            }
        })
    };


    /**
     *
     * sets up event handlers for the new subpage without compromising existing ones.
     *
     * @param subpage {HTMLElement} the subpage dom element
     * @param activate {Boolean} renders the subpage the active container
     */
    addSubpageEventHandlers(subpage, activate){
        //add onclick handlers to docker elements
        $(subpage).find($(".docker-subElement")).on('click', (e)=> {
            //just follow link, nothing to do here for now
        });

        // clicks on mainElement shall expand container, second click should follow link
        $(subpage).find($(".docker-mainElement")).on('click', (e)=> {
            // might prove better to use state module pattern if this grows.
            e.stopImmediatePropagation();
            e.preventDefault();

            // find container TODO: do not use jquery
            let container = $(e.currentTarget).parent(".docker-elementContainer")[0];

            // check if container is expanded
            if (container.classList.contains("expanded")) {
                // collaps it.
                this.collapseContainer(container);
            }
            else {
                //collaps all other expanded containers
                //never collaps active container
                // collaps only containers with class "collapsing"
                for (const el of this.elementContainer){
                    if(el.id === container.id || !el.classList.contains("expanded") || el.classList.contains("docker-container-active") || !el.classList.contains("collapsing")) continue;
                    this.collapseContainer(el);
                }
                // expand container
                this.expandContainer(container)
            }
        })
    };

    collapseContainer(container) {
        // assume container is a htmlElement
        // lidl.assertHTMLElement(container);
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

    expandContainer(container) {
        // assume container is a htmlElement
        // lidl.assertHTMLElement(container);
        // find subcontainer
        let subContainer = container.getElementsByClassName("docker-subElementContainer")[0];
        if (subContainer === undefined) return false;
        // get current height
        let currentHeight = subContainer.scrollHeight;
        // have the element transition to the height of its inner content
        subContainer.style.height = currentHeight + 'px';
        let transition = subContainer.addEventListener('transitionend', function(e) {
            // remove "height" from the element's inline styles, so it can return to its initial value
            subContainer.style.height = null;
        },{once: true});
        // apply container class change.
        container.classList.add("expanded");
    };

    activateElement(activeContainer, activeEl) {
        activeContainer.classList.add("docker-container-active");
        activeContainer.classList.add("expanded");

        if (activeEl) {
            let containerDomElement = activeEl.parentElement;
            activeEl.classList.add("docker-element-active");
            containerDomElement.classList.add("docker-element-active");
        }
    };

    setActiveElementId(domId){
        if (typeof domId != "string") throw new TypeError('argument ’domId’ is not a string');
        this.activeElementId = domId;
    };

    getActiveElementId(){
        return this.activeElementId;
    };

    notifyWhenReady(){
        return new Promise((resolve,reject) => {
            if (this.ready){
                resolve();
            }
            else {
                //wait for docker to build dom
                //add promise
                var p = {
                    resolve: ()=>{
                        resolve();
                    },
                    reject: ()=>{
                        reject();
                    },
                }
                this.addObserver(p);
            }
        })
    };


    /**
     * adds a subpage to docker
     * @param {String} type - type of subpage. this value determines which template is used
     * @param {Object} data - JSON containing data for template rendering
     * @param {Object} options - overwrite [bool]: replace existing subpages if id matches, position: {place: ["fixed", "auto", "first", "last", "beforeMain"], group: <Number>}
     * @param {Number} [id] - (Optional) set id for the new subpage. Fails if id exists without the overwrite option
     * @param dockerAcl {Object} - (Optional) json containing meta-data for template rendering
     * @returns {*}
     */
    addDockerSubPage(type, data, options, id, dockerAcl) {
        let defaultOptions = {
            overwrite: false,
            position: {
                place: "auto",
                group: 0,
            },
        }
        if (dockerAcl === undefined) dockerAcl = {};
        options = Object.assign({}, defaultOptions, options);
        // build context
        var context = {};

        //generate subpageId if none was provided
        if (id === undefined) {
            id = this.subpageHandler.generateId();
        }
        else {
            if (this.subpageHandler.findById(id) !== undefined){
                //without overwrite, fail
                if (!options.overwrite) {
                    throw new Error("Error (docker.js): Cannot replace existing subpages without overwrite option.");
                }
                //with overwrite, replace current subpage with new one
                else {
                    this.subpageHandler.remove(id);
                }
            }
            //else: id does not exist, continue
        }

        var subpage = {
            id: id,
            type: type,
            isActive: false,
            position: options.position,
        }

        // this.subpageHandler.add(subpage);

        let url;
        switch(type){
            case "user":
                url = '/webpack/docker/templates/subpage-user.hbs';
                context = {
                    id: id,
                    exploredUser: data,
                };
                break;
            case "userEdit":
                url = '/webpack/docker/templates/subpage-userEdit.hbs';
                context = {
                    id: id,
                    exploredUser: data,
                };
                break;
            case "event":
                url = '/webpack/docker/templates/subpage-event.hbs';
                context = {
                    id: id,
                    exploredEvent: data,
                };
                break;
            case "eventEdit":
                url = '/webpack/docker/templates/subpage-event.hbs';
                context = {
                    id: id,
                    exploredEvent: data,
                };
                break;
            case "system":
                url = '/webpack/docker/templates/subpage-system.hbs';
                context = {
                    id: id,
                };
                break;
            case "userSettings":
                url = '/webpack/docker/templates/subpage-userSettings.hbs';
                context = {
                    id: id,
                };
                break;
            case "role":
                url = '/webpack/docker/templates/subpage-role.hbs';
                context = {
                    id: id,
                    roleData: data,
                };
                break;
        }
        $.get(url, function (data) {
            let template = Handlebars.compile(data);
            appendContent(template, context)

        });

        let appendContent = (template, context) => {
            this.notifyWhenReady()
                .then(()=> {
                    context.docker = this.dockerAcl;
                    Object.assign(context.docker, dockerAcl); //subpage specific acl
                    var subpageContainer = document.getElementById("docker-subPage-container");
                    //create new wrapper
                    let subpageWrapper = document.createElement("div");
                    subpageWrapper.className = "subpage-wrapper";
                    subpageWrapper.innerHTML = template(context);
                    subpageWrapper.id = context.id;

                    subpageContainer.append(subpageWrapper);
                    this.subpageHandler.add(subpage);

                    const subpageDom = document.getElementById(context.id);
                    this.addSubpageEventHandlers(subpageDom, true);
                    this.subpageHandler.show(context.id);
                    //initially setup dom elements
                    const container = document.getElementById(dockerArgs.activeContainer);
                    const el = document.getElementById(dockerArgs.activeElementId);
                    if(el) this.activateElement(container, el);
                })
                .catch()
        }

        return id;
    };

    getTopBarHeight(){
        return this.topBarHeight;
    };


};
