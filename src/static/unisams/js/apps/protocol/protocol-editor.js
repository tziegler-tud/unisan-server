var lidlRTO = window.lidlRTO;
var app = window.app;

$(document).ready (function () {
    let document = window.currentExploredProtocol;
    // let drawer = new app.Drawer({});
    // let topbar = new app.Topbar({
    //     pageData: {
    //         title: document.title,
    //     },
    //     data: document
    // });

    let nav = new app.Navigation({
        pageData: {
            title: document.title,
        },
        data: document
    })
})
