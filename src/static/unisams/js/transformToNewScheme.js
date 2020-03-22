

var getDataFromServer  = function(url, callback){

    // get qualification data from server
    $.ajax({
        url: url,
        type: 'GET',
        cache: false,
        isModified: false,
        data: {},
        success: callback,
    });
};

function transformUser(userId){
    var user;
    getDataFromServer("/unisams/usermod/"+userId,function(context){
        user = context;
        //build new object
        var data = {
            username: user.username,
            generalData: {
                firstName: user.firstName,
                lastName: user.lastName,
            },
            contactData: {
                email: user.email,
            },

        };

        if (context.generalData) {
            if (user.generalData.memberId) data.generalData.memberId = user.generalData.memberId;
            if (user.generalData.phone) data.contactData.phone = {private: user.generalData.phone};
        }
        if (context.customData) data.customData = context.customData;

        $.ajax({
            url: "/unisams/usermod/" + userId,
            // make put for safety reasons :-)
            type: 'PUT',
            dataType: 'json',
            data: data,
            success: function(result) {
                removeOld(userId);
                alert("success");
            }
        });
    });
}

function removeOld(userId) {
    var user;
    getDataFromServer("/unisams/usermod/" + userId, function (context) {
        user = context;
        var args = {};
        window.actions.removeDBKey(userId, "firstName", args);
        window.actions.removeDBKey(userId, "lastName", args);
        window.actions.removeDBKey(userId, "phone", args);
        window.actions.removeDBKey(userId, "email", args);
        window.actions.removeDBKey(userId, "custom", args);
        window.actions.removeDBKey(userId, "Email", args);
    })
}