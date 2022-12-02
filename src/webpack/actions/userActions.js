var userActions = {

    addUser: function (data, args) {
        let defaults = {
            memberId: {
                setCustom: false,
            },
            userImg: {
                tmp: false,
            }
        }
        args = (args === undefined) ? {} : args;
        args = Object.assign(defaults, args);

        var memberId = {
            title: "Mitgliedsnummer",
        }
        if (args.memberId.setCustom) {
            memberId.value = data.memberId;
        }
        //user image has already been uploaded. Pass path to server
        if (args.userImg.tmp) {

        }
        var jsonData = {
            username: data.username,
            password: data.password,
            generalData: {
                firstName: {title: "Vorname", value: data.generalData.firstName},
                lastName: {title: "Nachname", value: data.generalData.lastName},
                memberId: memberId,
            },
            args: args,
        };

        $.ajax({
            url: "/api/v1/usermod/create",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/unisams/user/edit/" + data.username)
            }
        });
    },

    deleteUser: function (userid) {

        // build a json object or do something with the form, store in data
        $.ajax({
            url: "/api/v1/usermod/" + userid,
            type: 'DELETE',
            success: function (result) {
                alert("User " + userid + " deleted.");
                window.location.replace("/unisams/user");
            }
        });

    },

    uploadImage: function (userid) {
        $.ajax({
            url: "/api/v1/usermod/" + userid + "/uploadUserImage",
            type: 'POST',
            success: function (result) {
                alert("User " + userid + " image updated");
                window.location.replace("/unisams/user/view/" + userid);
            }
        });
    },

    removeDBKey: function (userid, keyIdentifier, value, args, callback) {
        callback = (callback == null) ? function () {
        } : callback;
        args = (args == null) ? function () {
        } : args;
        var data = {
            key: keyIdentifier,
            value: value,
            isArray: args.isArray,
            args: {
                noIndex: false,
                arrayElementDbId: undefined,
            }
        };

        $.ajax({
            url: "/api/v1/usermod/deleteKey/" + userid,
            // make put for safety reasons :-)
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function (result) {
                callback();
            }
        });
    },

    updateDBKey: function (userid, keyIdentifier, value, args, callback) {
        callback = (callback == null) ? function () {
        } : callback;
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
            success: function (result) {
                callback(result)
            }
        });
    },

    updateCurrentUserPassword: function (userid, currentPassword, newPassword, args, callback) {
        callback = (callback == null) ? function () {
        } : callback;
        var data = {
            currentPassword: currentPassword,
            newPassword: newPassword,
            args: args,
        };
        return $.ajax({
            url: "/api/v1/usermod/updateCurrentUserPassword/",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function (result) {
                callback(result)
            }
        });
    },

    insertDBKey: function (userid, keyIdentifier, value, args, callback) {
        callback = (callback == null) ? function () {
        } : callback;
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
            success: function (result) {
                callback();
                window.location.reload();

            }
        });
    },

    addQualification: function (userid, keyIdentifier, value, args, callback) {
        callback = (callback == null) ? function () {
        } : callback;
        var data = {
            data: value,
            args: args,
        };
        $.ajax({
            url: "/api/v1/usermod/qualification/" + userid,
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function (result) {
                callback();
                window.location.reload();

            }
        });
    },

    updateQualification: function (userid, keyIdentifier, value, args, callback) {
        callback = (callback == null) ? function () {
        } : callback;
        var data = {
            id: value.id,
            data: value,
            args: args,
        };
        $.ajax({
            url: "/api/v1/usermod/qualification/" + userid,
            // make put for safety reasons :-)
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function (result) {
                callback();
                window.location.reload();

            }
        });
    },

    removeQualification: function (userid, keyIdentifier, value, args, callback) {
        callback = (callback == null) ? function () {
        } : callback;
        var data = {
            id: value.id,
            args: args,
        };
        $.ajax({
            url: "/api/v1/usermod/qualification/" + userid,
            // make put for safety reasons :-)
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function (result) {
                callback();
                window.location.reload();

            }
        });
    },

    getLogs: function (targetId, logType, callback) {
        callback = (callback == null) ? function () {
        } : callback;
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
            success: function (result) {
                callback.onSuccess(result);

            }
        });
    },

    addGroup: function(data, args) {
        let jsonData = {
            userGroupId: data.userGroupId,
            userId: data.userId,
            args: args,
        }
        $.ajax({
            url: "/api/v1/usermod/addUserGroup/"+data.userId,
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/unisams/settings/roles/"+data.userGroupId)
            }
        });
    },



    removeGroup: function(data, args) {
        let jsonData = {
            userGroupId: data.userGroupId,
            userId: data.userId,
            args: args,
        }
        $.ajax({
            url: "/api/v1/usermod/removeUserGroup/"+data.userId,
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/unisams/settings/roles/"+data.userGroupId)
            }
        });
    },

    setRole: function(data, args, callback) {
        let jsonData = {
            role: data.role,
            userId: data.userId,
            args: args,
        }
        return $.ajax({
            url: "/api/v1/usermod/setUserRole/"+data.userId,
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                window.location.reload();
            }
        });
    }
}

export {userActions}