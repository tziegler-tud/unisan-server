var lidlRTO = window.lidlRTO;

document.addEventListener("DOMContentLoaded", function(event) {

    console.log("js active, removing noscript fallback");
    $("body").removeClass("no-js");

    lidlRTO = new lidl.Main();

    lidlRTO.addManager(new lidl.ObjectManager(),true);

    lidl.addDebugCategory(lidl.debugCategory.FULL);

    var waiting = false;
    }
);

window.lidlRTO = lidlRTO;

$(window).on('load',function() {
    console.log("finished loading, hiding preloader");
    var plr = common.preloader();
    setTimeout(plr.hide,0);

});

$(window).on('resize',function(){

});







