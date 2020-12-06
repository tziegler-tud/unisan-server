var lidlRTO = window.lidlRTO;
var app = window.app;

$(document).ready (function () {
    let protocol = window.currentExploredProtocol;
    // let drawer = new app.Drawer({});
    // let topbar = new app.Topbar({
    //     pageData: {
    //         title: document.title,
    //     },
    //     data: document
    // });

    let nav = new app.Navigation({
        pageData: {
            title: protocol.title,
        },
        data: protocol
    });

    //choose protocol template
    let template="divi";
    let url;
    switch(template){
        case "divi":
            url="/static/unisams/js/apps/protocol/templates/divi.hbs";
            break;
        default:
            url="/static/unisams/js/apps/protocol/templates/divi.hbs";
            break;
    }

    //render template
    $.get(url, function (data) {
        var template = Handlebars.compile(data);
        let content = template(protocol);
        let protocolContainer = document.getElementById("protocol-container");
        protocolContainer.innerHTML = content;
    });


});
