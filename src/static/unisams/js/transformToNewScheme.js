

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
        var email = "";
        Object.keys(user.contactData.email[0]).forEach(function(k){email = email + user.contactData.email[0][k]});
        var data = {
            username: user.username,
            generalData: user.generalData,
            contactData: {
                email: [{
                    title: "dienstlich",
                    value: email,
                }],
            },
        };
        if (context.phone) {
            if (context.phone[0].private) {
                data.contactData.phone = [{
                    title: "privat",
                    value: user.contactData.phone[0].private,
                }]
            }
        }
        if (context.customData) data.otherData = {customData: context.customData};

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