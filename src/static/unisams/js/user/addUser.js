$(function() {
    $('#addUserFormSubmit').on("click", function(event) {
        event.preventDefault(); // Stops browser from navigating away from page
        var data = {
            username:   $('#userinp-username').val(),
            password:   $('#userinp-password').val(),
            generalData: {
                firstName:  $('#userinp-firstName').val(),
                lastName:   $('#userinp-lastName').val(),
            },
        };
        let args = {
            data: data,
            memberId: {setCustom: false},
        }
        actions.addUser(args)
    });
});