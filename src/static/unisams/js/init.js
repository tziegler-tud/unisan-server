var lidlRTO = window.lidlRTO;

window.dockerArgs = {containerSelector: "docker-inner"};

document.addEventListener("DOMContentLoaded", function(event) {

    console.log("js active, removing noscript fallback");
    $("body").removeClass("no-js");

    lidlRTO = new lidl.Main();

    lidlRTO.addManager(new lidl.ObjectManager(),true);

    lidl.addDebugCategory(lidl.debugCategory.FULL);

    window.Docker = new common.Docker(window.dockerArgs);

    Handlebars.registerHelper('transformDateString', function(dateString) {
        var myDate = new Date(dateString);
        var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
        var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();

        var date = myDate.getFullYear() + "-" + month + "-" + day;
        return new Handlebars.SafeString(date);
    });

});

window.lidlRTO = lidlRTO;

$(window).on('load',function() {
    console.log("finished loading, hiding preloader");
    var plr = common.preloader();
    setTimeout(plr.hide,0);

});

$(window).on('resize',function(){

});







