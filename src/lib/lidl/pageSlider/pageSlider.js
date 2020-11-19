/**
 *
 * lidl page Slider
 *
 * build multi-part forms with a nice interface and joint data api call at the end
 *
 *
 * @author: Tom Ziegler
 * @version: 0.1b
 *
 *
 * @namespace lidl
 *
 */

(function (lidl,$,undefined) {

    jQuery.fn.reverse = [].reverse;

    lidl.PageSlider = function(container, token){

        this.pageCounter = 0;
        this.currentPage = 0;

        this.container = container
        this.token = token;
        this.data = {}; //filled by completing pages
        this.pages = {};
        this.currentPage = 0;
        this.container.classList.add("lidl-pageSlider-container");

        this.callback = {};


        let inner = document.createElement("div");
        inner.id = "lidl-pageslider-inner"+token;
        inner.classList.add("lidl-pageSlider-inner");
        this.pageContainer = inner;
        this.container.prepend(inner);

        var self = this;

        //init event handlers. Note: Create buttons with class "pageslider-next" and "pageslider-prev"
        $(this.container).find(".pageslider-next").each(function(el){
            this.addEventListener("click", function(e){
                //validate
                if(!self.pages[self.currentPage].checkRequiredFields()) return false;
                if(!self.pages[self.currentPage].validate()) return false;
                self.pages[self.currentPage].save();
                self.nextPage();
            })
        })
        $(this.container).find(".pageslider-prev").each(function(el){
            this.addEventListener("click", function(e){
                self.pages[self.currentPage].save();
                self.previousPage();
            })
        })

        this.addClassToInputs = function(className){
            $(this.container).find("input").each(function(inp){
                this.classList.add(className);
            })
        }
        this.addClassToLabel = function(className){
            $(this.container).find("label").each(function(inp){
                this.classList.add(className);
            })
        }

        this.setCallback = function(callbackObj) {
            this.callback.onComplete = callbackObj.onComplete;
            this.callback.onError = callbackObj.onError;
        }

        this.createPageId = function(){
            self.pageCounter++;
            return self.pageCounter;
        }
        this.nextPage = function(){
            if(this.currentPage === this.pageCounter) {
                //reached end of pages. submit data
                if(self.callback.onComplete){
                    self.callback.onComplete(self.data);
                }
            }
            else {
                //display next page
                self.showPage(self.currentPage+1);
            }
        }
        this.previousPage = function(page){
            if(this.currentPage === 1) {
                //reached first page

            }
            else {
                self.showPage(self.currentPage-1);
            }
        }

        this.savePageData = function(page, data){
            this.data[page.id] = data;
        }
        this.showPage = function(id) {
            let self = this;
            if(this.currentPage === id) return;
            this.pages[id].show(this.currentPage);
            let current = this.pages[this.currentPage]
            if (current) current.hide();
            this.currentPage = id;
            let pageAmountMultiplier = 100 / self.pageCounter
            $(this.pageContainer).css({
                'transform': 'translateX(-'+ (id-1) * pageAmountMultiplier +'%)'
            })

        }
        return this;
    };

    lidl.PageSlider.Page = function(parent){
        this.id = parent.createPageId();
        var data = {};
        var container;
        this.container = {};
        var self = this;
        var objects = [];
        this.validators = [];
        this.onSave = function(){
            return true;
        };

        this.setContainer = function(c){
            this.container = c;
            container = c;
        }
        this.addObject = function(key, value) {
            if (key === undefined) {
                console.error("failed to add object to Page data: invalid key")
            }
            if (value === undefined) {
                console.error("failed to add object to Page data: invalid object")
            }
            objects.push({key: key, value: value});
        };
        this.setOnSaveCallback = function(func) {
            self.onSave = func;
        }
        this.save = function(){
            this.onSave();
            //saves the data and moves on to the next page
            $(container).find(".pageslider-page-dataElement").each(function(){
                let key = this.name;
                if (key === undefined) key = "undefined";
                data[key]= this.value;
            })
            objects.forEach(function(el){
                let key = el.key;
                data[key]= el.value;
            })

            parent.savePageData(this, data);
        }
        this.nextPage = function(){
            //displays next page without saving
            parent.nextPage();
        }

        this.previousPage = function(){
            //displays previous page
            parent.previousPage();
        }
        this.show = function(){
            container.classList.remove("page-hidden");
            container.classList.add("page-active");
        }
        this.hide = function(){
            container.classList.add("page-hidden");
            container.classList.remove("page-active");
        }

        this.addCustomValidator = function(func, callback) {
            this.validators.push({function: func, callback: callback});
        }

        this.checkRequiredFields = function(){
            let valid = true;
            //find all inputs
            $(container).find(".pageslider-page-dataElement").reverse().each(function(){
                if(this.required === true){
                    if (this.value.length === 0) {
                        let el = this;
                        //if mdc text field, find the container
                        if (this.classList.contains("mdc-text-field__input")){
                            el = $(this).parents(".mdc-text-field")
                        }
                        //trigger html5 styling by adding some input and removing it
                        el.value = 1;
                        el.value = "";
                        el.focus();
                        $(el).effect("shake", {distance: 2, times: 1}, "fast");
                        valid = false;
                    }
                }
            })
            return valid;
        }

        this.validate = function(){
            var valid = true;
            this.validators.forEach(function(validator){
                //execute validator function
                try {
                    if(validator.function()) {
                        validator.callback.onSuccess()
                    }
                    else {
                        validator.callback.onFailure();
                        valid = false;
                    }
                }
                catch(e) {
                    console.error("callback error: " + e)
                    return false;
                }
            })
            return valid;
        }



        return this;
    }

    lidl.PageSlider.prototype.addPage = function(HTMLContent){
        let self = this;
        //create page object
        let page = new lidl.PageSlider.Page(self);
        // create new page container
        let pageHTML = document.createElement("div");
        pageHTML.id = "pageslider-page" + page.id;
        pageHTML.classList.add("pageSlider-page");
        //add html content
        pageHTML.innerHTML = HTMLContent;
        page.setContainer(pageHTML);
        self.pageContainer.append(pageHTML);

        self.pages[page.id] = page;
        //update style rule
        self.pageContainer.style.width = self.pageCounter * 100 + "%";
        self.pagesIterator(function(id, page){
            $(page.container).css({
                "flex": "1 1 " + (100/self.pageCounter) + "%",
            })
        })

        //if this is the first page to be created, display it initially
        if (self.currentPage === 0) self.showPage(page.id);
        return page;
    };

    lidl.PageSlider.prototype.pagesIterator = function(func){
        let self = this;
        for (const [id, page] of Object.entries(self.pages)) {
            func(id, page);
        }
    }






    return lidl.PageSlider;



}(lidl = window.lidl || {}, jQuery));