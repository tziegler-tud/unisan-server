var userActions = {

    /**
     * api call to create new user.
     * @param data {Object}
     * @param args {Object}
     * @param {Object} args.memberId
     * @param {Boolean} args.memberId.setCustom true to set a custom memberId
     * @param {Integer} args.memberId.value custom memberId
     * @param {Object} args.userImg
     * @param {Boolean} args.userImg.tmp true to use an image from tmp storage as user image
     * @param {String} args.userImg.tmpkey tmpkey for the uploaded image, obtained from api response
     * @param {String[]} args.groups Array of group ids to add to the user
     * @param {Boolean} args.redirect true to redirect browser window to the profile of the newly added user
     * @returns {Promise<unknown>}
     */
    addUser: function (data, args) {
        let self = this;
        let defaults = {
            memberId: {
                setCustom: false,
            },
            userImg: {
                tmp: false,
            },
            groups: [],
            redirect: true,
        }
        args = (args === undefined) ? {} : args;
        args = Object.assign(defaults, args);

        return new Promise(function(resolve, reject){

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

            let action = $.ajax({
                url: "/api/v1/usermod/create",
                // make put for safety reasons :-)
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(jsonData),

            });

            action.then(result => {
                if(Array.isArray(args.groups) && args.groups.length > 0) {
                    let groupsPromises = [];
                    //assign groups
                    let jsonData = {
                        userId: result.id,
                        args: args,
                    }
                    args.groups.forEach(groupId => {
                        jsonData.userGroupId = groupId;
                        let action = $.ajax({
                            url: "/api/v1/usermod/addUserGroup/" + jsonData.userId,
                            type: 'POST',
                            contentType: "application/json; charset=UTF-8",
                            dataType: 'json',
                            data: JSON.stringify(jsonData)
                        });
                        groupsPromises.push(action)
                    })
                    Promise.all(groupsPromises)
                        .then(results => {
                            onSuccess();
                        })
                        .catch()
                }
                else {
                    onSuccess();
                }
            })

            function onSuccess(){
                if (args.redirect) location.replace("/user/edit/" + data.username)
                resolve();
            }
        })
    },

    deleteUser: function (userid) {

        // build a json object or do something with the form, store in data
        $.ajax({
            url: "/api/v1/usermod/" + userid,
            type: 'DELETE',
            success: function (result) {
                alert("User " + userid + " deleted.");
                window.location.replace("/user");
            }
        });

    },

    uploadImage: function (userid) {
        $.ajax({
            url: "/api/v1/usermod/" + userid + "/uploadUserImage",
            type: 'POST',
            success: function (result) {
                alert("User " + userid + " image updated");
                window.location.replace("/user/view/" + userid);
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

    updateUserPassword: function (userid, currentPassword, newPassword, args, callback=()=>{}) {
        var data = {
            userid: userid,
            currentPassword: currentPassword,
            newPassword: newPassword,
            args: args,
        };
        return $.ajax({
            url: "/api/v1/usermod/updateUserPassword/",
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

    updateCurrentUserPassword: function (currentPassword, newPassword, args, callback) {
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
                location.replace("/system/roles/"+data.userGroupId)
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
                location.replace("/system/roles/"+data.userGroupId)
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