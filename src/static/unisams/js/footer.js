(function (footer,$,undefined) {

    var s = "footer-mobile"; //footer dom id

    footer.init = function(){

        var footerDOM = document.getElementById(s);
        try {
            lidl.assertHTMLElement(footerDOM);
        }
        catch (e){
            console.warn("footer element with id " + s + " failed to initialize. Did you run this before document has been loaded?");
        }
        var items = footerDOM.getElementsByClassName('trigger');
        for (var i = 0; i < items.length; i++) {

            items[i].addEventListener('click',function(e){
                var el = e.currentTarget;
                el.classList.toggle("active");
                checkForOutsideClick(el);
            });
        }
    };

    /**
     *
     * Checks wheter there is a click outside of a given element, and performs an action if so.
     *
     * @param element [object] concerning HTML Element. This is assumed to be valid, so make sure you are confident in your variables before calling this function.
     *
     *
     *
     */

    var checkForOutsideClick = function(element) {
        const outsideClickListener = event => {
            if (!element.contains(event.target) && isVisible(element)) { // or use: event.target.closest(selector) === null
                element.classList.remove("active");
                removeClickListener();
            }
        };

        const removeClickListener = () => {
            document.removeEventListener('click', outsideClickListener)
        };

        document.addEventListener('click', outsideClickListener)
    };

    const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );

    return footer;


}(footer = window.footer || {}, jQuery));