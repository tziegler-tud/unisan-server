common = window.common;
(function (actions,$,undefined) {

    actions.deleteUser = function(userid) {

        // build a json object or do something with the form, store in data
        $.ajax({
            url: "/unisams/usermod/" + userid,
            type: 'DELETE',
            success: function(result) {
                alert("User " + userid + " deleted.");
                window.location.replace("/unisams/user");
            }
        });

    };

    actions.uploadImage = function(userid){
        $.ajax({
            url: "/unisams/usermod/" + userid + "/uploadUserImage",
            type: 'POST',
            success: function(result) {
                alert("User " + userid + " image updated");
                window.location.replace("/unisams/user/" + userid);
            }
        });
    };

    actions.removeDBKey = function(userid, keyIdentifier){
        var data = {
          key: keyIdentifier
        };

        $.ajax({
            url: "/unisams/usermod/deleteKey/" + userid,
            // make put for safety reasons :-)
            type: 'PUT',
            dataType: 'json',
            data: data,
            success: function(result) {
                $("#useritem-"+ common.escapeSelector(keyIdentifier)).remove();
            }
        });
    };

    actions.updateDBKey = function(userid, keyIdentifier, value){
        var data = {
            key: keyIdentifier,
            value: value
        };

        $.ajax({
            url: "/unisams/usermod/updateKey/" + userid,
            // make put for safety reasons :-)
            type: 'PUT',
            dataType: 'json',
            data: data,
            success: function(result) {

            }
        });
    };

    actions.insertDBKey = function(userid, keyIdentifier, value, args){
        var data = {
            key: keyIdentifier,
            value: value
        };

        if(args) for(var k in args) data[k]=args[k];

        $.ajax({
            url: "/unisams/usermod/updateKey/" + userid,
            // make put for safety reasons :-)
            type: 'PUT',
            dataType: 'json',
            data: data,
            success: function(result) {
                window.location.reload();

            }
        });
    };

}(actions = window.actions || {},jQuery));