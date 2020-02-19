var lidlRTO = window.lidlRTO;

$(document).ready (function () {


    var sidebar = new common.Sidebar('wrapper', {title: "Test"});

    // hook user entries to sidebar.

    $('.user-entry').each(function(){
        $(this).on("click", function(e){
            e.preventDefault();
            sidebar.addContent("user", {
                userid: this.dataset.userid
            });
            sidebar.show();
        })
    });

    $('.radio-item').checkboxradio({
        icon: false
    });
    $('#userlist02').checkboxradio({
        disabled: true
    });

    $(".useredit-addUserBtn").on("click", function(e) {
        e.preventDefault();
        sidebar.addContent('addUser', {
                userid: null,
                callback: {
                    onConfirm: function(userid, key, value){
                        actions.insertDBKey(userid, key, value);
                    }
                }
            },
        );
       sidebar.show();
    });



});