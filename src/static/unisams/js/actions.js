common = window.common;
(function (actions,$,undefined) {

    actions.addUser = function(args) {
        var data = {
            username: args.username,
            password: args.password,
            generalData: {
                firstName: args.firstName,
                lastName: args.lastName
            },
        };
        $.post('/unisams/usermod/create', data, function(resp) {
            location.replace("/unisams/user/" + data.username + "/editUser")
            // do something when it was successful
        });
    };

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

    actions.removeDBKey = function(userid, keyIdentifier, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            key: keyIdentifier,
            value: value,
            isArray: args.isArray
        };

        $.ajax({
            url: "/unisams/usermod/deleteKey/" + userid,
            // make put for safety reasons :-)
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback();
            }
        });
    };

    actions.updateDBKey = function(userid, keyIdentifier, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            key: keyIdentifier,
            value: value,
            args: args,
        };
        $.ajax({
            url: "/unisams/usermod/updateKey/" + userid,
            // make put for safety reasons :-)
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback()
            }
        });
    };

    actions.insertDBKey = function(userid, keyIdentifier, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            key: keyIdentifier,
            value: value,
            args: args,
        };
        $.ajax({
            url: "/unisams/usermod/updateKey/" + userid,
            // make put for safety reasons :-)
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback();
                window.location.reload();

            }
        });
    };

}(actions = window.actions || {},jQuery));