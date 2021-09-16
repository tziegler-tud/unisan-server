var lidlRTO = window.lidlRTO;
var phone = window.matchMedia("only screen and (max-width: 50em)");
var tablet = window.matchMedia("only screen and (min-width: 50em) and (max-width: 75em)");
$(document).ready (function () {
    // window.DockerElement = new docker.Docker(window.dockerArgs);
    var sidebar = new common.Sidebar('wrapper', {title: "Test"});

    sidebar.addContent("user", {
        userid: window.userId
    });
    if(phone.matches || tablet.matches) {
       sidebar.hide();
    }
    else {
        sidebar.show();
    }
});