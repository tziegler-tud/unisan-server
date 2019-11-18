var lidlRTO;

document.addEventListener("DOMContentLoaded", function(event) {

    console.log("js active, removing noscript fallback");
    $("body").removeClass("no-js");

    lidlRTO = new lidl.Main();

    lidlRTO.addManager(new lidl.ObjectManager(),true);

    lidl.addDebugCategory(lidl.debugCategory.FULL);


    var token = lidlRTO.objectManager.createNewObjectToken();
    var nav = new window.lidl.nav.Nav(token,"nav","nav-static","menu");
    lidlRTO.objectManager.addObject(nav,token);


    var floatingButtonRef = (typeof window.floatingButtonRefId === 'undefined') ? document.getElementById("footer-mobile") : document.getElementById(window.floatingButtonRefId);
    var floatingButtonContext = (typeof window.floatingButtonContextId === 'undefined') ? window : document.getElementById(window.floatingButtonContextId);
    var fixEnabled = (typeof window.fixEnabled === 'undefined') ? true : window.fixEnabled;
    var scrollContainerRef = (typeof window.scrollContainerRefId === 'undefined') ? window : document.getElementById(window.scrollContainerRefId);

    common.smoothScrolling(scrollContainerRef);
    common.floatingButtonInit(floatingButtonRef, floatingButtonContext, fixEnabled);
    common.generateLinks();

    footer.init();

    var waiting = false;



    scrollContainerRef.addEventListener('scroll', function(e) {

        if (waiting) {
            return;
        }
        waiting = true;



        common.scrollEvent(scrollContainerRef);



        setTimeout(function () {
            waiting = false;
        }, 100);

    });


    }
);

$(window).on('load',function() {
    console.log("finished loading, hiding preloader");
    var plr = common.preloader();
    setTimeout(plr.hide,0);



});

$(window).on('resize',function(){

});







