var userSettingsActions = {
    /**
     *
     * @param {String} userid
     * @param {String} newPassword
     * @param {Object} args
     * @param {Function} callback
     * @returns {*}
     */
    updateUserMailPassword(userid, newPassword, args)  {
        var data = {
            userid: userid,
            password: newPassword,
            args: args,
        };
        return $.ajax({
            url: "/api/v1/settings/mail/setpassword",
            // make put for safety reasons :-)
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
        });
    },
}

export {userSettingsActions}