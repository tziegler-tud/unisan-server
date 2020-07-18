var lidlRTO = window.lidlRTO;

$(document).ready (function () {

    var currentExploredUser;
    var profile = new window.profile.Profile(window.exploreUserId);

    // create new observer
    var observer = new lidl.Observer(function(user){
        currentExploredUser = user;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    profile.getUserAndSubscribe(observer)
        .then(function(user){
            buildPage(user)
        })
        .catch(function(reason){
            console.error("Failed to retrieve user data:" + reason)
        });

    function buildPage(user) {

        window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("user", user);

        var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

        var addDBKey_sidebar = new common.Sidebar('wrapper', {title: "Test"});

        $(".quallist-entry").on("click", function(e) {
            e.preventDefault();
            var self = this;

            addDBKey_sidebar.addContent('UserViewQualification', {
                    userid: user.id,
                    qualificationId: self.dataset.qualificationid,
                    callback: {
                        onConfirm: function(){
                        },
                    },
                },
            );
            addDBKey_sidebar.show();
        });

        // $(".userkey-entry").on("click", function(e) {
        //     e.preventDefault();
        //     var self = this;
        //
        //     addDBKey_sidebar.addContent('UserViewDBKey', {
        //             userid: userid,
        //             keyId: self.dataset.keyid,
        //             key: self.dataset.key,
        //             catKey: self.dataset.catkey,
        //             subKey: self.dataset.subkey,
        //             value: self.dataset.value,
        //             callback: {
        //
        //             },
        //         },
        //     );
        //     addDBKey_sidebar.show();
        // });

    }
});