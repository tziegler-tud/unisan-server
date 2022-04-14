import "./scrollableList.scss";
const Handlebars = require("handlebars");
import "../helpers/handlebarsHelpers";

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
 * constructor for EditableInputField objects
 *
 * @param {HTMLElement} container - container dom element
 * @param {String} type - type of data. ["user", "event", "qualification"]
 * @param {Object} data - iterateable JSON object containing data for list entries
 * @param {Object} args
 * @param {Object} callback
 * @returns {Window.common.ScrollableList}
 * @constructor
 */
var ScrollableList = function(container,type, data,  args, callback){
    if (container === undefined) throw new Error("cannot instantiate list without container");
    if (type === undefined) type = "qualification";
    this.id = ScrollableListCounter.next();

    args = applyArgs(args);

    container.classList.add("scrollableList");
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

ScrollableList.prototype.setView = function(view){
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
            url.list = '/webpack/scrollableList/templates/eventList.hbs'
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
        self.adjustList();
        setupEventHandlers(self)
        //if sorting is applied, mark the column accordingly by setting dom class
        if(self.sorting.direction !== 0 && self.sorting.property != null) {
            //find header column and add class
            $(self.container).find(".scrollableList-header-column").each(function(index){
                let c = (self.sorting.direction === 1) ? "sort-asc" : "sort-desc";
                if (this.dataset.property === self.sorting.property) this.classList.add(c);
            });
        }

    }
    function buildCards(self, html) {
        //append to container
        self.container.innerHTML = html;
        cardEventHandlers(self)
    }

    return true;
}

ScrollableList.prototype.adjustList = function() {
    let self = this;
    // set width of first row
    let row = self.container.getElementsByClassName("scrollableList-top")[0];
    let listContent = self.container.getElementsByClassName("scrollableList-content")[0];

    let height = "40em"; //fallback
    if(self.args.height === "full"){
        //use all available viewport height.
        //get viewport height
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        //get height of top navigation and topbar element
        //TODO: remove dom id dependency

        // let navHeight = document.getElementById("nav-top").clientHeight +1;
        let topBarHeight = window.DockerElement.getTopBarHeight();
        let contentHeight = document.getElementById("content1-heading").clientHeight;
        //calc remaining height in px  5px offset to compensate borders
        height = vh - (topBarHeight + contentHeight + row.clientHeight +5) + "px";
    }
    if (self.args.height === "fixed") {
        //use fixedHeight param
        height = self.args.fixedHeight;
    }
    //set element height
    $(listContent).css({
        "max-height": height,
        "overflow": "auto",
    });
    //wait for changes to apply
    let p = new Promise(function(resolve, reject) {
        setTimeout(resolve,200);
    })
    //get scollbar width
    p.then(()=> {
        let scrollbarWidth = listContent.offsetWidth - listContent.clientWidth;
        $(row).css({
            "width": "auto",
            "padding-right": scrollbarWidth + "px",
        })
    });
}

ScrollableList.prototype.sort = function(property, direction) {
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
    $(window).on('resize',function(){
        self.adjustList();
    });
    if(self.args.enableSorting) {
        $(".scrollableList-header-column").on("click", function(e){
            sortByColumn(self, e.currentTarget);
        })
    }
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

export{ScrollableList}