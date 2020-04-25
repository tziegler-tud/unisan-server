/**
 *
 * Wrapper function for certain small functions, mostly for event triggering
 *
 * @namespace common
 *
 */

(function (common,$,undefined) {
    var lidl = window.lidl;
    var debug = false;

    //lidl.addDebugCategory(lidl.debugCategory.SCROLL);


    /*
    Private variables
     */





    /*
    private Modules
     */


    var ScrollEventStateModule = (function(){
        var state = false;
        var ScrollState = {};

        ScrollState.setState = function (newstate) {

            if (newstate) {


                state = true;
            }

            state = newstate;
        };
        ScrollState.getState = function () {
            return state;
        };

        return ScrollState;

    }());




    /*
    public functions
     */



    /**
     *
     * Adjusts heights and margins to fit page to container
     *
     *
     *
     */
    common.adjust_page = function () {

        //var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        //var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        /*var wrapper = document.getElementById("wrapper");
        lidl.assert(w,true);
        $(wrapper).css({
            "margin-top": navHeight
        });
        var c = document.getElementById("content-top");
        lidl.assert(c,true);
        $(c).css({

            "height": h - navHeight
        });
        */


    };

    var viewportDetector = function(){

        var el = document.getElementById('infobar2');
        try{
            assert(el,debug);
        }
        catch (err){
            console.alert("infobar not found, unregistering listener...");
            return false;

        }
        var options;

        if(!CounterStateModule.getState() && isVisible(el)){

            CounterStateModule.setState(true);

            $('.count').each(count);

            function count(options) {
                var $this = $(this);
                options = $.extend({}, options || {}, $this.data('countToOptions') || {});
                $this.countTo(options);
            }






        }
        return true;

    };

    common.preloader = function(){
        var plr = {};
        var self = document.getElementById("preloader");

        plr.hide = function(){
            self.classList.remove("preloader-active");
            self.classList.add("preloader-hidden");
        };

        return plr;


    };


    /*
    private functions
     */


    /**
     * Checks whether a DOM element is placed inside the current viewport
     *
     * @param element{object} DOM element to be checked
     *
     * @returns{boolean} true if element is in current viewport, else returns false
     *
     *
     */

    var isVisible = function (element){
        var rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)+100 && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
        );
    };

    //const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );

    common.smoothScrolling = function(ref){
        if(ref===window){ref='html,body';}
        document.querySelectorAll('a[href^="#"]').forEach(
            function(item) {
                item.addEventListener('click', function (e) {
                e.preventDefault();
                var href = document.querySelector(this.getAttribute('href'));
                $(ref).animate({
                    scrollTop:$(href).offset().top - document.getElementById('nav').clientHeight
                },'slow');

        });
    });
    };

    common.generateLinks = function(){
        var list = document.getElementsByClassName("mail-hidden");
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            var s = it.dataset.prefix + "@unisan-dresden.de";
            if(it.classList.contains("mailto")){
                it.href="mailto:" + s;
            }
            if(it.classList.contains("itsatrap")){
                it.removeAttribute("href");
            }
            if(it.classList.contains("text")){it.innerHTML = s;}
        }
        return true;
    };

    common.escapeSelector = function(selector){
            return selector.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1" );
    };




    return common;


}(window.common = window.common || {}, jQuery));