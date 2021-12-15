import "./userlist.scss";

import {MDCMenu} from '@material/menu';


/**
 *
 * @param containerId {String} id of container html element
 * @param data {Object} data to render
 * @param template  {String} path to handlebars template (.hbs)
 * @param args {Object} { show: {Boolean} Default=true display list initially, height: {String} [fill, fixed, auto], fixedHeight: {String} }
 * @returns {Userlist}
 * @constructor
 */
var Userlist = function(containerId, data, template, args) {
    let defaults = {
        template: '/webpack/templates/userlist.hbs',
        data: {},
        containerId: "userlist-container",
        args: {
            show: false,
            height: "fill",
            fixedHeight: "unset",
        }
    }
    template = template === undefined ? defaults.template : template;

    this.container = document.getElementById(containerId);
    this.templatePromise = $.get(template);

    var self = this;

    this.templatePromise
        .then(function(template){
            let html = generateHtml(template, data);
            displayList(self.container, html, args);

        })
        .catch(function(err){
            console.error("Failed to get userlist template: " + template + ": " + err);
        })

    return this;
}

/**
 *
 * @param data data to be fed into the template
 * @param refresh {Boolean} Default: true   Redraws the template with the new data
 */
Userlist.prototype.setData = function(data, refresh){
    refresh = refresh === undefined ? true : refresh
    this.data = data;
    if (refresh) {
        displayList(this.container, data);
    }
}

Userlist.prototype.addEventHandler = function(handler) {
    handler();
}


function displayList(container, html, args) {
    container.innerHTML = html;
    //delay adjustment until sidebar finished rendering
    adjustList(container, args);
    initEventHandlers();
}
function initEventHandlers(callbacks) {
//setup drowpdowns
    $(".userlist-menu-container").each(function(e){
        let menuDom = $(this).find(".mdc-menu")[0];
        const menu = new MDCMenu(menuDom);
        $(this).find(".dropdown-clicker").click(function(e){
            menu.open =true;
        })
    })

    const menu = new MDCMenu(document.querySelector('.mdc-menu'));

    //init event Handlers
    $(".userlist-view").click(function(e){
        let userid = this.dataset.userid;
        location.replace("/unisams/user/"+userid);
    })
}



function adjustList(c, args) {
    let container = c === undefined ? document.getElementById('userlist-container') : c;
    // set width of first row
    let row = document.getElementById("userlist-top");

    //height adjustment depends on args
    let type = args.height;
    let fixed = args.fixedHeight;

    let cssHeightProperty = "auto";

    switch(type){
        case "auto":
            cssHeightProperty = "auto";
            break;

        case "fill":
            //get viewport height
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            //get height of top navigation and topbar element
            let navHeight = document.getElementById("nav-top").clientHeight +1;
            let topbarHeight = document.getElementById("content1-heading").clientHeight;
            //calc remaining height
            let h = vh - (navHeight + topbarHeight + row.clientHeight + 10);
            cssHeightProperty = h + "px";
            break;

        case "fixed":
            if (fixed === undefined) {
                console.warn("Trying to set userlist to fixed height, but no value was given. Setting to auto...");
                cssHeightProperty = "auto";
            }
            cssHeightProperty = fixed;
    }
    //set element height
    $(container).css({
        "height": cssHeightProperty,
        "overflow": "auto",
    });

    //get scollbar width
    let scrollbarWidth = container.offsetWidth - container.clientWidth;
    $("#userlist-top").css({
        "width": "auto",
        "padding-right": scrollbarWidth + "px",
    })
}

function generateHtml(template, data) {
    var temp = Handlebars.compile(template);
    return temp(data);
}

export{Userlist}