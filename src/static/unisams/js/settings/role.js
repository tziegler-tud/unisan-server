var lidlRTO = window.lidlRTO;
var common = window.common;
var actions = window.actions;


$(document).ready (function () {

    //group is in window.group
    let group = window.group;

    // window.DockerElement = new docker.Docker(window.dockerArgs);
    window.DockerElement.addDockerSubPage("role", group);
    var sidebar = new common.Sidebar('wrapper', {title: "Test"});


});