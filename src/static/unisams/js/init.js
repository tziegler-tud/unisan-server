var lidlRTO = window.lidlRTO;

window.dockerArgs = {containerSelector: "nav-docker"};

document.addEventListener("DOMContentLoaded", function(event) {

    console.log("js active, removing noscript fallback");
    $("body").removeClass("no-js");

    lidlRTO = new lidl.Main();

    lidlRTO.addManager(new lidl.ObjectManager(),true);

    lidl.addDebugCategory(lidl.debugCategory.FULL);

    window.DockerElement = new docker.Docker(window.dockerArgs);

    Handlebars.registerHelper('transformDateString', function(dateString) {
        var myDate = new Date(dateString);
        var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
        var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();

        var date = day + "." + month + "." + myDate.getFullYear();
        return new Handlebars.SafeString(date);
    });

    Handlebars.registerHelper('transformDateTimeString', function(dateString) {
        var myDate = new Date(dateString);
        var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
        var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();

        var hours = myDate.getHours().toString().length < 2 ? "0"+myDate.getHours().toString() : myDate.getHours().toString();
        var minutes = myDate.getMinutes().toString().length < 2 ? "0"+myDate.getMinutes().toString() : myDate.getMinutes().toString();

        var date =  day + "." + month + "." + myDate.getFullYear() + " " + hours + ":" + minutes;
        return new Handlebars.SafeString(date);
    });

    Handlebars.registerHelper('hasRole', function(participant, roleString) {
        return participant.role === roleString;
    });

    Handlebars.registerHelper('nextItem', function (array, index, options) {
        return options.fn(array[index + 1]);
    });


    //get current user
    var user;
    var profile = new window.profile.Profile(window.userId);

    // create new observer
    var observer = new lidl.Observer(function(u){
        user = u;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    profile.getUserAndSubscribe(observer)
        .then(function(user){
            window.user = user;
        })
        .catch(function(reason){
            console.error("Failed to retrieve user data:" + reason)
        });

    adjustWrapper();

});

window.lidlRTO = lidlRTO;

$(window).on('load',function() {
    console.log("finished loading, hiding preloader");
    var plr = common.preloader();
    setTimeout(plr.hide,0);

});

$(window).on('resize',function(){
    adjustWrapper();
});

function adjustWrapper(){
    //get viewport height
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    //get height of top navigation and topbar element
    let navHeight = document.getElementById("nav-top").clientHeight + 1;
    $("#wrapper").css({
        height: (vh - navHeight) + "px"
    })
}







