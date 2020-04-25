var lidlRTO = window.lidlRTO;

$(document).ready (function () {

    var userid = window.exploreUserId;

    var ddMenu = common.DropdownMenu(".dropdown-menu", "click");

    var addDBKey_sidebar = new common.Sidebar('wrapper', {title: "Test"});

    $(".quallist-entry").on("click", function(e) {
        e.preventDefault();
        var self = this;

        addDBKey_sidebar.addContent('UserViewQualification', {
                userid: userid,
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


});