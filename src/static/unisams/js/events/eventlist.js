var lidlRTO = window.lidlRTO;

$(document).ready (function () {
    buildPage();
    $(window).on('resize',function(){
        adjustList();
    });

    function buildPage(result) {
        var sidebar = new common.Sidebar('wrapper', {title: "Test"});
        var handleData = {};

        //display all users initially
        displayEventList("");

        //setup searchbar
        let searchbarContainer = document.getElementById("usersearch");
        var searchbar = new common.Searchbar(searchbarContainer, {
            onInput: {
                enabled: true,
                callback: function(inputValue){
                    displayEventList(inputValue)
                },
            },
        });

        function displayEventList(filter) {
            let data = {
                filter: filter,
                args: {
                    sort: "date.startDate"
                }
            };
            //get user list from server
            $.ajax({
                url: "/api/v1/eventmod/filter",
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result) {
                    handleData.eventlist = result;
                    // render userlist template
                    $.get('/static/unisams/js/events/templates/eventlist.hbs', function (data) {
                        var template = Handlebars.compile(data);
                        appendContent(template(handleData))
                    });
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert(XMLHttpRequest.status + ": " + textStatus);
                }
            });

            function appendContent(html) {
                //append to subpage container #userlist-container
                let container = document.getElementById('eventlist-container');
                container.innerHTML = html;

                adjustList(container);
                // hook user entries to sidebar.

                $('.event-entry').each(function(){
                    $(this).on("click", function(e){
                        e.preventDefault();
                        window.location = "/events/view/" + this.dataset.eventid;
                    })
                });


            }
        }

        $('.radio-item').checkboxradio({
            icon: false
        });
        $('#eventlist02').checkboxradio({
            disabled: true
        });

    }

    function adjustList(c) {
        let container = c === undefined ? document.getElementById('eventlist-container') : c;
        // set width of first row
        let row = document.getElementById("eventlist-top");

        //get viewport height
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        //get height of top navigation and topbar element
        let navHeight = document.getElementById("nav-top").clientHeight +1;
        let topbarHeight = document.getElementById("content1-heading").clientHeight;
        //calc remaining height
        let h = vh - (navHeight + topbarHeight + row.clientHeight +1);
        //set element height
        $(container).css({
            "height": h + "px",
            "overflow": "scroll",
        });

        //get scollbar width
        let scrollbarWidth = container.offsetWidth - container.clientWidth;
        $("#eventlist-top").css({
            "width": "auto",
            "padding-right": scrollbarWidth + "px",
        })
    }


});