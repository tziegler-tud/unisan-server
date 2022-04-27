import "./scrollableListMobile.scss";
const Handlebars = require("handlebars");
import "../helpers/handlebarsHelpers";
import {MDCList} from '@material/list';
import {MDCRipple} from '@material/ripple';


let ScrollableListCounter = {
    counter: 0,
    next: function(){
        this.counter++;
        return this.counter;
    },
    current: function(){
        return this.counter;
    }
}

/**
 * constructor for ScrollableList objects
 *
 * @param {HTMLElement} container - container dom element
 * @param {String} type - type of data. ["user", "event", "qualification"]
 * @param {Object} data - iterateable JSON object containing data for list entries
 * @param {Object} args
 * @param {Object} callback
 * @returns {Window.common.ScrollableList}
 * @constructor
 */
var ScrollableListMobile = function(container,type, data,  args, callback){
    if (container === undefined) throw new Error("cannot instantiate list without container");
    if (type === undefined) type = "qualification";
    this.id = ScrollableListCounter.next();

    args = applyArgs(args);

    container.classList.add("scrollableListMobile");
    this.args = args;
    this.data = data;
    this.initialData = jQuery.extend(true, {}, data);
    this.callback = callback;
    this.container = container;
    this.type = type;
    this.viewUrl = "";
    this.templateUrl = applyType(type, this);
    this.sorting = args.sorting;
    this.view = args.view;
    buildHTML(this, data);
    var self = this;

    return this;
};

ScrollableListMobile.prototype.setView = function(view){
    if (view === undefined || typeof (view) !== "string") view = "list"
    else {
        if (view === "cards") {
            this.view = "cards";
        }
        else {
            this.view = "list";
        }
    }
    buildHTML(this, this.data);
}

var applyType = function(type, self) {
    let url = {list: "", cards: ""}
    switch(type) {
        case "qualification":
            url.list = '/static/unisams/js/scrollableList/templates/qualificationList.hbs'
            break;
        case "log":
            url.list = '/static/unisams/js/scrollableList/templates/logList.hbs'
            break;
        case "user":
            url.list = '/static/unisams/js/scrollableList/templates/userList.hbs'
            break;
        case "event":
            url.list = '/webpack/scrollableList/templates/eventListMobile.hbs'
            url.cards = '/webpack/scrollableList/templates/eventCards.hbs'
            self.viewUrl = "/unisams/events/view/:id"
            break;
        case "logDetails":
            url.list = '/static/unisams/js/scrollableList/templates/logdetailsList.hbs'
            break;
    }
    return url;
}

var applyArgs = function(args){
    let defaultArgs = {
        enableSorting: true,
        view: "list",
        height: "fixed",
        fixedHeight: "40em",
        sorting: {
            property: null,
            direction: 0,
        },
        acl: {}
    }
    if (args===undefined) {
        return defaultArgs;
    }
    // else {
    //     args.enableSorting = (args.enableSorting === undefined || typeof(args.enableSorting) !== "boolean") ? defaultArgs.enableSorting : args.enableSorting;
    //     args.fullHeight = (args.fullHeight === undefined || typeof(args.fullHeight) !== "boolean") ? defaultArgs.enableSorting : args.enableSorting;
    // }
    return Object.assign(defaultArgs, args);
};

var buildHTML = function(self, data){
    var handleData = {
        listdata: data,
        acl: self.args.acl,
    };

    if (self.view === "cards"){
        //render cards template
        $.get(self.templateUrl.cards, function (data) {
            var template = Handlebars.compile(data);
            buildCards(self, template(handleData))
        });
    }
    else {
        // render list template
        $.get(self.templateUrl.list, function (data) {
            var template = Handlebars.compile(data);
            buildList(self, template(handleData))
        });
    }


    function buildList(self, html) {
        //append to container
        self.container.innerHTML = html;
        setupEventHandlers(self);
        const list = new MDCList(document.querySelector('.mdc-list'));
        const listItemRipples = list.listElements.map((listItemEl) => new MDCRipple(listItemEl));
        //if sorting is applied, mark the column accordingly by setting dom class

    }
    function buildCards(self, html) {
        //append to container
        self.container.innerHTML = html;
        cardEventHandlers(self)
    }

    return true;
}

ScrollableListMobile.prototype.adjustList = function() {

}

ScrollableListMobile.prototype.sort = function(property, direction) {
    let self = this;
    if(property === undefined || property === null) direction = 0;
    if (typeof(direction)==="string") {
        switch(direction){
            case "asc":
                direction = 1;
                break;
            case "desc":
                direction = -1;
                break;
            default:
                direction = 0;
        }
    }
    if(direction === 1)
    {
        //sort ascending
        self.data.sort(function(a,b){
            if (common.refJSON(a,property) < common.refJSON(b,property)) return -1;
            if (common.refJSON(a,property) > common.refJSON(b,property)) return 1;
            return 0;
        })
        buildHTML(self, self.data);
    }
    else {
        if (direction === -1) {
            //sort descending
            //sort ascending
            self.data.sort(function(a,b){
                if (common.refJSON(a,property) < common.refJSON(b,property)) return 1;
                if (common.refJSON(a,property) > common.refJSON(b,property)) return -1;
                return 0;
            })
            buildHTML(self, self.data);
        }
        else {
            if (direction === 0) {
                //remove any sorting
                if(self.sorting.direction !== 0){
                    buildHTML(self, self.initialData)
                }
            }
        }
    }
    this.sorting = {
        property: property,
        direction: direction,
    }
}

var sortByColumn = function(self, headerElement) {
    //get property from header element
    let property = headerElement.dataset.property;
    if(property === undefined) {
        console.warn("failed to sort list: header property not set.")
        return false;
    }
    if(self.sorting.property === property) {
        //currently sorted by this property
        if (self.sorting.direction === 1) {
            //currently sorted in asc direction, reverse
            //sort desc
            self.sort(property, "desc")
        }
        else if (self.sorting.direction === -1) {
            //currently sorted in desc direction, remove sorting
            //revert sorting to initial state
            self.sort(null, 0)
        }
    }
    else {
        //currently not sorted by this property, sort asc
        self.sort(property, "asc");
    }
}

var setupEventHandlers = function(self){
    if(self.callback.listItem.onClick !== undefined) {
        $(".scrollableList-item").on("click", function(e){
            self.callback.listItem.onClick(e)
        });
    }
};

var cardEventHandlers = function(self){

    //register item links
    $(".gallery-item").on("click", function(){
        const viewkey = this.dataset.viewkey;
        let url = self.viewUrl.replace(":id", viewkey);
        window.location = url;
    })

    const dropdowns = [].map.call(document.querySelectorAll(".dropdown-button"), function (el) {
        const container = $(el).closest(".dropdown-menu");
        const drop = new common.DropdownMenu(container, "click", el);
    });


};

export{ScrollableListMobile}