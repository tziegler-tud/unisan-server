import "./common.scss";

import {Docker} from "./docker/docker"
import {lidl} from "../lib/lidl-modules/core/lidlModular-0.2"
import {Observer as lidlObserver} from "../lib/lidl-modules/observer/lidl-observer"
import {Dialog as lidlDialog} from "../lib/lidl-modules/dialog/lidl-dialog"
import {Snackbar} from "./helpers/snackbar";
import {UserProfile} from "./userprofile/userprofile";
import {Preloader} from "./helpers/preloader";
import {DropdownMenu} from "./helpers/dropdownMenu";



var lidlRTO = window.lidlRTO;

const Handlebars = require("handlebars");

if (window.dockerArgs === undefined) {
    window.dockerArgs = {}
}
window.dockerArgs.containerSelector= "nav-docker";


document.addEventListener("DOMContentLoaded", function(event) {
    console.log("js active, removing noscript fallback");
    $("body").removeClass("no-js");

    lidlRTO = new lidl.Lidl();
    window.lidlRTO = lidlRTO;

    lidlRTO.addManager(new lidl.ObjectManager(),true);

    lidlRTO.addDebugCategory(lidl.debugCategory.FULL);

    window.snackbar = new Snackbar();

    Handlebars.registerHelper('transformDateString', function(dateString, format) {
        format = (format === undefined || typeof(format) !== "string") ? "text" : format;
        var myDate = new Date(dateString);
        var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
        var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();
        var date;

        if (format === "input") {
            date = myDate.getFullYear() + "-" + month + "-" + day;
        }
        else {
            date = day + "." + month + "." + myDate.getFullYear();
        }
        return new Handlebars.SafeString(date);
    });

    Handlebars.registerHelper('transformDateTimeString', function(dateString, format) {
        format = (format === undefined || typeof(format !== "String")) ? "text" : format;
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
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });


    //get current user
    var user;
    var profile = new UserProfile(window.userId);
    window.currentUserProfile = profile;
    // create new observer
    var observer = new lidlObserver(function(u){
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

    window.DockerElement = new Docker(window.dockerArgs);

    window.DockerElement.notifyWhenReady()
        .then(function(){
            adjustWrapper();
        })
        .catch(err => console.log(err));

    //initalize top-nav dropdown
    const navDrop = new DropdownMenu("#topNav-dropdown", "click", ".topNav-dropdown-trigger", {});
    navDrop.addHandler(".navTop-dropdown--user", function(){
        window.location = "/user/current";
    }, {});
    navDrop.addHandler(".navTop-dropdown--settings", function(){
        window.location = "/settings";
    }, {});
    navDrop.addHandler(".navTop-dropdown--logout", function(){
        window.location = "/logout";
    }, {});
});

window.lidlRTO = lidlRTO;

$(window).on('load',function() {
    console.log("finished loading, hiding preloader");
    var plr = new Preloader();
    setTimeout(plr.hide,0);

});

$(window).on('resize',function(){
    adjustWrapper();
});

function adjustWrapper(){
    //get viewport height
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    //get height of top navigation and topbar element
    // let navHeight = document.getElementById("nav-top").clientHeight + 1;
    let navHeight = window.DockerElement.getTopBarHeight() + 1;
    $("#wrapper").css({
        height: (vh - navHeight) + "px"
    })
}







