import "./scrollableList.scss";
import "./scrollableListMobile.scss";
const Handlebars = require("handlebars");
import "../helpers/handlebarsHelpers";
import {dateFromNow, refJSON, transformDateTimeString} from "../helpers/helpers";
import {DropdownMenu, Corner} from "../helpers/dropdownMenu";
import {phone, tablet} from "../helpers/variables";


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
 * @param {string} type - type of data. ["user", "event", "qualification", "news", "userQualification", "participants", "postings", "log", "logDetails"]
 * @param {Object} data - iterateable object containing data for list entries
 * @param {Object} args constructor args
 * @param {boolean}  [args.enableMobile] true to render mobile version.
 * @param [args.view = "list"] {string} choose between "list" and "cards" view. Default: list
 * @param [args.height = "fixed"] {string} limits container dimensions. Options: "full": expand to fill parent container, "fixed": fixed height, use fixedHeight parameter to set a value, "force-fixed": like fixed, but does not collapse. Default: fixed
 * @param [args.fixedHeight = "40em"] {string} css-parseable value. Requires "height" parameter to be set to "fixed".
 * @param args.sorting {Object} sorting object
 * @param args.sorting.property {string} property to be sorted
 * @param args.sorting.direction {string} direction. Either "asc" or "desc"
 * @param args.grouping {Object} grouping object
 * @param args.grouping.property {string} property to use for grouping
 * @param args.grouping.mode {string} grouping mode ["smartDate", "value"]
 * @param [args.acl] {Object} Contains additional information for rendering purposes, usually concerning user access rights. This object is passed to the template as Object named "acl".
 * @param args.hasTitle {Boolean} true if title is provided
 * @param args.title {string} title of scrollable List. Requires hasTitle to be set to true.
 * @param {Object} [callback] callback object
 * @param {Object} [callback.listItem] Callback object for generated list items
 * @param {function[]} [callback.customHandlers] Array of functions to be applied
 * @returns {ScrollableList}
 * @constructor
 */
var ScrollableList = function(container,type="generic", data,  args, callback){
    if (container === undefined) throw new Error("cannot instantiate list without container");
    this.id = ScrollableListCounter.next();

    args = applyArgs(args);

    container.classList.add("scrollableList");
    this.args = args;
    this.data = data;
    this.groupedData = undefined;
    this.isGrouped = false;
    // this.initialData = jQuery.extend(true, {}, data);
    this.initialData = data.slice();
    this.callback = callback;
    this.container = container;
    this.type = type;
    this.viewUrl = undefined;
    this.templateUrl = applyType(type, this);
    this.sorting = args.sorting;
    this.grouping = args.grouping;
    this.view = applyView(args.view, args.enableMobile);
    // buildHTML(this, data, args);
    this.sort(this.sorting.property, this.sorting.direction, false, false);
    if(this.grouping) {
        this.group(this.grouping.property, this.grouping.mode, false, false);
    }
    buildHTML(this, this.data, this.args);
    return this;
};


ScrollableList.prototype.setView = function(view){
    let self = this;
    if (view === undefined || typeof (view) !== "string") view = "list"
    if (view === "cards") {
        this.view = "cards";
    }
    else {
        self.view = "list"
        if(self.args.enableMobile){
            if(phone.matches){
                self.view = "mobileList"
            }
        }
    }
    buildHTML(this, this.data, this.args);
}

var applyView = function(view, enableMobile) {
    if (view === undefined || typeof (view) !== "string") view = "list"
    if (view === "list") {
        if (enableMobile) {
            if (phone.matches) {
                view = "mobileList"
            }
        }
    }
    return view;
}


var applyType = function(type, self) {
    let url = {list: "", cards: ""}
    switch(type) {
        case "userQualification":
            url.list = '/webpack/scrollableList/templates/userQualificationList.hbs'
            break;
        case "qualification":
            url.list = '/webpack/scrollableList/templates/qualificationList.hbs'
            break;
        case "log":
            url.list = '/webpack/scrollableList/templates/logList.hbs'
            break;
        case "user":
            url.list = '/webpack/scrollableList/templates/userList.hbs'
            break;
        case "participants":
            url.list = '/webpack/scrollableList/templates/participantsList.hbs';
            break;
        case "postings":
            url.list = '/webpack/scrollableList/templates/postingsList.hbs';
            url.cards = '/webpack/scrollableList/templates/postingsListCards.hbs';
            url.mobile = '/webpack/scrollableList/templates/postingsListMobile.hbs';
            break;
        case "event":
            url.mobile = '/webpack/scrollableList/templates/eventListMobile.hbs'
            url.list = '/webpack/scrollableList/templates/eventList.hbs'
            url.cards = '/webpack/scrollableList/templates/eventCards.hbs'
            self.viewUrl = "/events/view/:id"
            break;
        case "logDetails":
            url.list = '/webpack/scrollableList/templates/logdetailsList.hbs'
            break;
        case "news":
            url.mobile = '/webpack/scrollableList/templates/news/newsListMobile.hbs'
            url.list = '/webpack/scrollableList/templates/news/newsList.hbs'
            url.cards = '/webpack/scrollableList/templates/news/newsCards.hbs'
            // self.viewUrl = "/news/view/:id"
            break;
        case "generic":
        default:
            url.mobile = "/webpack/scrollableList/templates/genericList.hbs";
            url.list = "/webpack/scrollableList/templates/genericList.hbs";
            url.cards = "/webpack/scrollableList/templates/genericCards.hbs";

    }
    return url;
}

var applyArgs = function(args){
    let defaultArgs = {
        enableSorting: true,
        enableMobile: false,
        enableDropdowns: false,
        view: "list",
        height: "fixed",
        fixedHeight: "40em",
        sorting: {
            property: null,
            direction: 0,
        },
        acl: {},
        hasTitle: false,
        title: "test",
        classes: "",
        listcolumns: [],
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

var buildHTML = function(self, data, args){
    var handleData = {
        listdata: data,
        acl: self.args.acl,
        args: args,
    };

    if(self.isGrouped){
        handleData.isGrouped = true;
        handleData.groupedData = self.groupedData;
    }

    switch(self.view) {
        case "cards":
            $.get(self.templateUrl.cards, function (data) {
                var template = Handlebars.compile(data);
                buildCards(self, template(handleData))
            });
            break;
        default:
        case "list":
            // render list template
            $.get(self.templateUrl.list, function (data) {
                var template = Handlebars.compile(data);
                buildList(self, template(handleData))
            });
            break;
        case "mobileList":
            $.get(self.templateUrl.mobile, function (data) {
                var template = Handlebars.compile(data);
                buildMobile(self, template(handleData))
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

    function buildMobile(self, html) {
        //append to container
        self.container.innerHTML = html;
        setupEventHandlers(self)
        //if sorting is applied, mark the column accordingly by setting dom class
    }

    return true;
}

ScrollableList.prototype.adjustList = function() {
    if(this.args.enableMobile) {
        if(this.view === "mobileList") {
            if (!phone.matches) {
                this.setView("list")
            }
            else return
        }
        if(phone.matches && this.view === "list") {
            this.setView(this.view);
            return;
        }
    }
    let self = this;
    // set width of first row
    let row = self.container.getElementsByClassName("scrollableList-top")[0];
    let listContent = self.container.getElementsByClassName("scrollableList-content")[0];

    let maxHeight = "40em"; //fallback
    let height = "auto";
    let marginBottom = 20;

    let heightSetting = self.args.height;
    if(phone.matches) {
        heightSetting = "mobile";
        maxHeight = "unset";
        height = "auto";
    }

    if(heightSetting === "full"){
        //use all available viewport height.
        //get viewport height
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        //get height of top navigation and topbar element
        //TODO: remove dom id dependency

        // let navHeight = document.getElementById("nav-top").clientHeight +1;
        let topBarHeight = window.DockerElement.getTopBarHeight();
        let contentHeight = document.getElementById("content1-heading").clientHeight;
        let spacers = $(".scrollableList--spacer");
        let spacerHeight = 0;
        spacers.each(function(element){
            spacerHeight = spacerHeight + this.clientHeight;
        })

        //calc remaining height in px  5px offset to compensate borders
        maxHeight = vh - (topBarHeight + contentHeight + spacerHeight + row.clientHeight + marginBottom +5) + "px";
    }
    if (heightSetting === "fixed") {
        //use fixedHeight param
        maxHeight = self.args.fixedHeight;
        height = "auto";
    }
    if(heightSetting === "force-fixed") {
        maxHeight = self.args.fixedHeight;
        height = self.args.fixedHeight;
    }
    $(self.container).css({
        "margin": "0 0 "+ marginBottom +"px 0",
    })
    //set element height
    $(listContent).css({
        "max-height": maxHeight,
        "height": height,
        "overflow": "auto",
    });

    //apply auto-alignment for generic list
    if(this.type === "generic") {
        //count columns
        const columnCount = this.args.listcolumns.length;
        //find inner elements for grid styling
        self.container.querySelectorAll(".inner").forEach(element => {
            $(element).css({
                "grid-template-columns": "repeat("+columnCount + ", 1fr)"
            })
        })

    }

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

ScrollableList.prototype.sort = function(property, direction, forceRebuild=false, render=true) {
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
    let sortObj = {
        property: property,
        direction: direction,
    }
    if(direction === 0)
    {
        //remove any sorting
        if(forceRebuild){
            buildHTML(self, self.initialData, self.args)
        }
        else {

            if (self.sorting.direction !== 0) {
                if(render) buildHTML(self, self.initialData, self.args)
            }
        }
    }
    else {
        let sortedData = sortData(self.data, sortObj);
        self.data = sortedData;
        if(render) buildHTML(self, sortedData, self.args);
    }
    this.sorting = {
        property: property,
        direction: direction,
    }
}

/**
 *
 * @param data {Object} iterable object containing data to be sorted
 * @param sortingObject {Object} sorting Object
 * @param sortingObject.property {String} property to be sorted for
 * @param sortingObject.direction {String} direction (1: asc, -1: desc)
 *
 * @returns {Object} the sorted data
 */
var sortData = function(data, sortingObject){
    let property = sortingObject.property;
    let direction = sortingObject.direction;
    if(property === undefined || property === null) direction = 0;
    if(direction !== -1 && direction !== 1) {
        console.warn("sidebar sorting subroutine error: Invalid argument received: direction: "+ direction)
        return data;
    }
    if(direction === 1)
    {
        //sort ascending
        data.sort(function(a,b){
            if (refJSON(a,property) < refJSON(b,property)) return -1;
            if (refJSON(a,property) > refJSON(b,property)) return 1;
            return 0;
        })
    }
    else {
        if (direction === -1) {
            //sort descending
            //sort ascending
            data.sort(function(a,b){
                if (refJSON(a,property) < refJSON(b,property)) return 1;
                if (refJSON(a,property) > refJSON(b,property)) return -1;
                return 0;
            })
        }
    }
    return data;
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

ScrollableList.prototype.group = function(property, mode, forceRebuild=false, render=true) {
    let self = this;
    if(property === undefined || property === null) {
        this.isGrouped = false;
        return;
    }

    self.groupingObject = {
        property: property,
        mode: mode,
    }

    if (typeof(mode)==="string") {
        switch(mode){
            case "smartDate":
                this.groupedData = groupBySmartDate(self.data, property)
                break;
            case "value":
            default:
                //not implemented
                this.isGrouped = false;
                this.groupedData = groupByValue(self.data, property);
                return;
        }
    }
    this.isGrouped = true;
    if(render) buildHTML(this, this.data, this.args);
}

var groupBySmartDate = function(data, property) {
    //smart grouping
    //get current date
    const date = new Date();
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = dateFromNow({days: -1}, today);
    const lastWeek =  dateFromNow({weeks:-1}, today);

    const groups = [
        {
            label: "Heute",
            minDate: today,
            maxDate: date,
        },
        {
            label: "Gestern",
            minDate: yesterday,
            maxDate: today,
        },
        {
            label: "letzte Woche",
            minDate: lastWeek,
            maxDate: yesterday,
        },
    ];

    data.forEach(function(item){
        sortIntoGroup(item);
    })
    return groups;

    function sortIntoGroup(item){
        const prop = item[property]
        const itemDate = new Date(prop);
        let matchingGroup = undefined;
        matchingGroup = groups.find(group => {
            return (group.minDate <= itemDate && group.maxDate > itemDate);
        })
        if(matchingGroup){
            if(matchingGroup.items === undefined) {
                matchingGroup.items = []
            }
            matchingGroup.items.push(item);
        }
        else {
            if(prop >= Date.now()){
                //entry is dated in the future. Create a group containing only the date
                const newGroup = {label: transformDateTimeString(itemDate).date, items: [item]}
                groups.push(newGroup)
            }
            else {
                //create month group and add entry
                const monthYear = transformDateTimeString(itemDate).monthYear;
                const minDate = new Date(itemDate);
                minDate.setDate(1);
                minDate.setHours(0,0,0,0);
                const maxDate = new Date(itemDate);
                maxDate.setMonth(maxDate.getMonth()+1);
                maxDate.setDate(0);
                maxDate.setHours(23,59,59,999);
                const newGroup = {label: monthYear, minDate: minDate, maxDate: maxDate, items: [item]}
                groups.push(newGroup);
            }
        }
    }
}

var groupByValue = function(data, property){

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
    if(self.callback){
        if(self.callback.listItem) {
            if(self.callback.listItem.onClick !== undefined) {
                $(".scrollableList-item").on("click", function(e){
                    self.callback.listItem.onClick(e)
                });
            }
        }
        if(self.callback.customHandlers !== undefined && Array.isArray(self.callback.customHandlers)) {
            self.callback.customHandlers.forEach(function(handler){
                handler(self);
            });
        }
    }
};

var cardEventHandlers = function(self){

    if(self.viewUrl) {
        $(".viewKey-item").on("click", function(){
            const viewkey = this.dataset.viewkey;
            let url = self.viewUrl.replace(":id", viewkey);
            window.location = url;
        })
    }
    if(self.callback){
        if(self.callback.listItem) {
            if(self.callback.listItem.onClick !== undefined) {
                $(".scrollableList-item").on("click", function(e){
                    self.callback.listItem.onClick(e)
                });
            }
        }
        if(self.callback.customHandlers !== undefined && Array.isArray(self.callback.customHandlers)) {
            self.callback.customHandlers.forEach(function(handler){
                handler(self);
            });
        }
    }
    if(self.args.enableDropdowns) {
        $('.card-menu-container').each(function(){
            let trigger = $(this).find(".card-menu-button").first();
            let m = new DropdownMenu(this, "click", trigger, {anchorCorner: Corner.BOTTOM_LEFT, fixed: true})
        });

    }


};

export{ScrollableList}