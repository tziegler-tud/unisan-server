common = window.common;
(function (actions,$,undefined) {

    actions.addUser = function(data, args) {
        var memberId = {
            title: "Mitgliedsnummer",
        }
        if (args.memberId.setCustom){
            memberId.value = data.memberId;
        }
        var jsonData = {
            username: data.username,
            password: data.password,
            generalData: {
                firstName: {title: "Vorname", value: data.generalData.firstName},
                lastName: {title: "Nachname", value: data.generalData.lastName},
                memberId: memberId,
            },
        };

        $.ajax({
            url: "/api/v1/usermod/create",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function(result) {
                location.replace("/unisams/user/edit" + data.username)
            }
        });
    };

    actions.deleteUser = function(userid) {

        // build a json object or do something with the form, store in data
        $.ajax({
            url: "/api/v1/usermod/" + userid,
            type: 'DELETE',
            success: function(result) {
                alert("User " + userid + " deleted.");
                window.location.replace("/unisams/user");
            }
        });

    };

    actions.uploadImage = function(userid){
        $.ajax({
            url: "/api/v1/usermod/" + userid + "/uploadUserImage",
            type: 'POST',
            success: function(result) {
                alert("User " + userid + " image updated");
                window.location.replace("/unisams/user/view/" + userid);
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
            url: "/api/v1/usermod/deleteKey/" + userid,
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
            url: "/api/v1/usermod/updateKey/" + userid,
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
            url: "/api/v1/usermod/updateKey/" + userid,
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

    actions.getUserLogs = function(targetId,logType, callback) {
        callback = (callback == null) ? function(){} : callback;
        var data = {
            targetId: targetId,
            logType: logType,
        };
        $.ajax({
            url: "/api/v1/logs/get/target/",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback.onSuccess(result);

            }
        });
    }

}(actions = window.actions || {},jQuery));