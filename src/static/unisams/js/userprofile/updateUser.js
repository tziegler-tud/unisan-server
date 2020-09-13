$(function() {
    $('#editUserFormSubmit').on("click", function(event) {
        event.preventDefault(); // Stops browser from navigating away from page
        var userid = this.dataset.userid;
        var data = {
            username:   $('#userinp-username').val(),
            // password:   $('#userinp-password').val(),
            firstName:  $('#userinp-firstname').val(),
            lastName:   $('#userinp-lastname').val(),
            email:      $('#userinp-email').val(),
        };
        // build a json object or do something with the form, store in data
        $.ajax({
            url: "/api/v1/usermod/" + userid,
            type: 'PUT',
            dataType: 'json',
            data: data,
            success: function(result) {
                alert("Updated user info.");
                location.replace("/unisams/user/view/" + data.username)
                // do something when it was successful
            }
        });
    });
});