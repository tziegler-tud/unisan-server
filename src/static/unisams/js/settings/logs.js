var lidlRTO = window.lidlRTO;
var common = window.common;
var actions = window.actions;


$(document).ready (function () {

    window.DockerElement = new docker.Docker(window.dockerArgs);
    var sidebar = new common.Sidebar('wrapper', {title: "Test"});

    //get logs
    $.ajax({
        url: "/api/v1/logs/get",
        type: 'GET',
        contentType: "application/json; charset=UTF-8",
        success: function(result) {
            displayLogList(result);
        }
    });
    function displayLogList(result) {

        var handleData = {logs: result};

        // render loglist template
        $.get('/static/unisams/js/settings/templates/loglist.hbs', function (data) {
            var template = Handlebars.compile(data);
            appendContent(template(handleData))
        });

        function appendContent(html) {
            //append to subpage container #loglist-container
            let container = document.getElementById('loglist-container');
            container.innerHTML = html;

            //delay adjustment until sidebar finished rendering
            setTimeout(function(){
             adjustList(container)
            }, 250);
            // hook log entries to sidebar.
            $('.log-entry').each(function () {
                $(this).on("click", function (e) {
                    let self = e.currentTarget;
                    e.preventDefault();
                    //get full log from results
                    let logObj = result.find(function(el){
                        return el.id === self.dataset.logid;
                    })
                    sidebar.addContent("logDetails", {
                        log: logObj
                    });
                    sidebar.show();
                })
            });


        }
        function adjustList(c) {
            let container = c === undefined ? document.getElementById('loglist-container') : c;
            // set width of first row
            let row = document.getElementById("loglist-top");

            //get viewport height
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            //get height of top navigation and topbar element
            let navHeight = document.getElementById("nav-top").clientHeight +1;
            let topbarHeight = document.getElementById("content1-heading").clientHeight;
            //calc remaining height
            let h = vh - (navHeight + topbarHeight + row.clientHeight + 10);
            //set element height
            $(container).css({
                "height": h + "px",
                "overflow": "auto",
            });

            //get scollbar width
            let scrollbarWidth = container.offsetWidth - container.clientWidth;
            $(row).css({
                "width": "auto",
                "padding-right": scrollbarWidth + "px",
            })
        }

        $(window).on('resize',function(){
            adjustList();
        });
    }
});