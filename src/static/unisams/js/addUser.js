$(function() {
    $('#addUserFormSubmit').on("click", function(event) {
        event.preventDefault(); // Stops browser from navigating away from page
        var data = {
            username:   $('#userinp-username').val(),
            password:   $('#userinp-password').val(),
            firstName:  $('#userinp-firstname').val(),
            lastName:   $('#userinp-lastname').val(),
            email:      $('#userinp-email').val(),
        };
        // build a json object or do something with the form, store in data
        $.post('/unisams/usermod/create', data, function(resp) {
            location.replace("/unisams/user/" + data.username)
            // do something when it was successful
        });
    });
});