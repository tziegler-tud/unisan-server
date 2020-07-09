var lidlRTO = window.lidlRTO;

$(document).ready (function () {




    var sidebar = new common.Sidebar('wrapper', {title: "Test"});

    sidebar.addContent("user", {
        userid: window.userId
    });

    sidebar.show();
});