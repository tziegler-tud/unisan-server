var lidlRTO = window.lidlRTO;

$(document).ready (function () {
    buildPage();
    $(window).on('resize',function(){
        adjustUserlist();
    });





    function buildPage(result) {
        var sidebar = new common.Sidebar('wrapper', {title: "Test"});
        var handleData = {};

        //display all users initially
        displayUserList("");

        //setup searchbar
        let searchbarContainer = document.getElementById("usersearch");
        var searchbar = new common.Searchbar(searchbarContainer, {
            onInput: {
                enabled: true,
                callback: function(inputValue){
                    displayUserList(inputValue)
                },
            },
        });

        function displayUserList(filter) {
            let data = {
                filter: filter,
                args: {
                    sort: "generalData.memberId.value",
                }};
            //get user list from server
            $.ajax({
                url: "/unisams/usermod/filter",
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result) {
                    handleData.userlist = result;
                    // render userlist template
                    $.get('/static/unisams/js/user/templates/userlist.hbs', function (data) {
                        var template = Handlebars.compile(data);
                        appendContent(template(handleData))
                    });
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("some error");
                }
            });

            function appendContent(html) {
                //append to subpage container #userlist-container
                let container = document.getElementById('userlist-container');
                container.innerHTML = html;

                adjustUserlist(container);

                // hook user entries to sidebar.
                $('.user-entry').each(function () {
                    $(this).on("click", function (e) {
                        e.preventDefault();
                        sidebar.addContent("user", {
                            userid: this.dataset.userid
                        });
                        sidebar.show();
                    })
                });

                // click on
            }
        }

        $('.radio-item').checkboxradio({
            icon: false
        });
        $('#userlist02').checkboxradio({
            disabled: true
        });

        $(".useredit-addUserBtn").on("click", function (e) {
            e.preventDefault();
            sidebar.addContent('addUser', {
                    userid: null,
                    callback: {
                        onConfirm: function (username, password, generalData, memberId) {
                            let args = {
                                data: {
                                    username: username,
                                    password: password,
                                    generalData: generalData,
                                },
                                memberId: memberId
                            };
                            actions.addUser(args);
                        }
                    }
                },
            );
            sidebar.show();
        });
    }

    function adjustUserlist(c) {
        let container = c === undefined ? document.getElementById('userlist-container') : c;
        // set width of first row
        let row = document.getElementById("userlist-top");

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
        $("#userlist-top").css({
            "width": "auto",
            "padding-right": scrollbarWidth + "px",
        })
        // $(row).find(".inner").each(function(){
        //     $(row).hide();
        //     // $(this).removeAttr( 'style');
        //     $(this).css("grid-template-columns", "");
        //     let current = $(this).css("grid-template-columns");
        //     $(row).show();
        //     //crop last value if it contains px value
        //     if(current.indexOf("px") > -1){
        //         current = current.substr(0,current.lastIndexOf(" ") +1);
        //     }
        //     $(this).css({
        //         "grid-template-columns": current + s,
        //     })
        // });
    }


});