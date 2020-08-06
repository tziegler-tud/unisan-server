$(function() {
    $('.userDelete').on("click", function(event) {
            var userid = this.dataset.userid;
            // build a json object or do something with the form, store in data
            $.ajax({
                url: "/api/v1/usermod/" + userid,
                type: 'DELETE',
                success: function(result) {
                    alert("User " + userid + " deleted.");
                    window.location.replace("/unisams/user");
                }
            });

        });
});