import "./pageSlider.css"
import PageSliderPage from "./Page";

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


jQuery.fn.reverse = [].reverse;

export default class PageSlider {
    constructor(container, token){

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
                self.pages[self.currentPage].save()
                    .then(()=>{
                        self.nextPage();
                    })
            })
        })
        $(this.container).find(".pageslider-prev").each(function(el){
            this.addEventListener("click", function(e){
                self.pages[self.currentPage].save()
                    .then(()=> {
                        self.previousPage();
                    })
            })
        })
    };

    addClassToInputs(className){
        $(this.container).find("input").each(function(inp){
            this.classList.add(className);
        })
    }
    addClassToLabel(className){
        $(this.container).find("label").each(function(inp){
            this.classList.add(className);
        })
    }

    setCallback(callbackObj) {
        this.callback.onComplete = callbackObj.onComplete;
        this.callback.onError = callbackObj.onError;
    }

    createPageId(){
        this.pageCounter++;
        return this.pageCounter;
    }
    nextPage(){
        if(this.currentPage === this.pageCounter) {
            //reached end of pages. submit data
            if(this.callback.onComplete){
                this.callback.onComplete(this.data);
            }
        }
        else {
            //display next page
            this.showPage(this.currentPage+1);
        }
    }
    previousPage(page){
        if(this.currentPage === 1) {
            //reached first page
        }
        else {
            this.showPage(this.currentPage-1);
        }
    }

    savePageData(page, data){
        this.data[page.id] = data;
    }
    showPage = function(id) {
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


    /**
     * adds a page to the PageSlider
     * @param HTMLContent HTML to be rendered as page
     * @returns {PageSliderPage} the freshly created page object
     */
    addPage(HTMLContent){
        let self = this;
        //create page object
        let page = new PageSliderPage(self);
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

    pagesIterator(func){
        let self = this;
        for (const [id, page] of Object.entries(self.pages)) {
            func(id, page);
        }
    }

}