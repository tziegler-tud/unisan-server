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

    lidl.PageSlider = function(containerId, token){

        this.container = $("#"+containerId);
        this.token = token;
        this.data = {}; //filled by completing pages
        this.pages = [];
        this.container.addClass("lidl-pageSlider-container");

        var self = this;

        this.createPageId = function(){
            return self.pages.length +1;
        }
    };

    lidl.PageSlider.Page = function(parent){
        this.id = parent.createPageId();

        this.completePage = function(page){
            //saves the data and moves on to the next form
        }

        return this;
    }

    lidl.PageSlider.prototype.addPage = function(HTMLElementId){
        let self = this;
        //for now, create pages in html source and just pass the reference
        let pageContainer = document.getElementById(HTMLElementId);
        //init event handlers. Note: Create buttons with class "pageslider-next" and "pageslider-prev"
        $(pageContainer).find(".pageslider-next").each(function(el){
            this.addEventListener("click", function(e){
                completePage(this);
            })
        })
        $(pageContainer).find(".pageslider-prev").each(function(el){

        })

        var page = self.PageSlider.Page(self);
        return page;
    };






    return lidl.PageSlider;



}(lidl = window.lidl || {}, jQuery));