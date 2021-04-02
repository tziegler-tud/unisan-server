(function (common, $, undefined) {

    /**
     * @namespace: common
     */

    common.scrollableListCounter = 0;

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
    common.ScrollableList = function(container,type, data,  args, callback){
        if (container === undefined) throw new Error("cannot instantiate list without container");
        if (type === undefined) type = "qualification";
        common.scrollableListCounter++;
        this.id = common.scrollableListCounter;
        args = applyArgs(args);

        container.classList.add("scrollableList");
        this.args = args;
        this.data = data;
        this.initialData = jQuery.extend(true, {}, data);
        this.callback = callback;
        this.container = container;
        this.templateUrl = applyType(type);
        this.sorting = args.sorting;
        buildHTML(this, data);



        var self = this;

        return this;
    };

    var applyType = function(type) {
        let url;
        switch(type) {
            case "qualification":
                url = '/static/unisams/js/scrollableList/templates/qualificationList.hbs'
                break;
            case "log":
                url = '/static/unisams/js/scrollableList/templates/logList.hbs'
                break;
            case "user":
                url = '/static/unisams/js/scrollableList/templates/userList.hbs'
                break;
            case "logDetails":
                url = '/static/unisams/js/scrollableList/templates/logdetailsList.hbs'
                break;
        }
        return url;
    }

    var applyArgs = function(args){
        let defaultArgs = {
            enableSorting: true,
            height: "fixed",
            fixedHeight: "40em",
            sorting: {
                property: null,
                direction: 0,
            }
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
            listdata: data
        };

        // render list template
        $.get(self.templateUrl, function (data) {
            var template = Handlebars.compile(data);
            appendContent(self, template(handleData))
        });

        function appendContent(self, html) {
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
        return true;
    }

    common.ScrollableList.prototype.adjustList = function() {
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
        //get scollbar width
        let scrollbarWidth = listContent.offsetWidth - listContent.clientWidth;
        $(row).css({
            "width": "auto",
            "padding-right": scrollbarWidth + "px",
        })
    }

    common.ScrollableList.prototype.sort = function(property, direction) {
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

    return common.ScrollableList;

}(window.common = window.common||{}, jQuery, undefined));