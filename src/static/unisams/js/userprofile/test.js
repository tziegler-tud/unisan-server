$(document).ready (function () {

    profile.getUser()
        .then(function (user) {
            console.log("works! User is: " + user.generalData.firstName.value + user.generalData.lastName.value);
        })
        .catch(function (reason) {
            console.error("Failed to retrieve user data:" + reason)
        });

    var doItAgain = function(){
        profile.getUser()
            .then(function (user) {
                console.log("works! User is: " + user.generalData.firstName.value + user.generalData.lastName.value);
            })
            .catch(function (reason) {
                console.error("Failed to retrieve user data:" + reason)
            });
    };

    setInterval(doItAgain,1000);
});