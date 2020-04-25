

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
        var array = [];
        if(Array.isArray(user.contactData[0].email)) {
            user.contactData[0].email.forEach(function (ob) {
                var d = {
                    type: "email",
                    title: "Email",
                    annotation: annotate(ob),
                    value: ob.value,
                };
                array.push(d);
            });
        }
        else {
            if(user.contactData[0].email) {
                var ob = user.contactData[0].email;
                var d = {
                    type: "email",
                    title: "Email",
                    annotation: annotate(ob),
                    value: ob.value,
                };
                array.push(d);
            }
        }
        if(Array.isArray(user.contactData[0].phone)){
            user.contactData[0].phone.forEach(function(ob){
                var d = {
                    type: "phone",
                    title: "Telefon",
                    annotation: annotate(ob),
                    value: ob.value,
                };
                array.push(d);
            });
        }
        else {
            if(user.contactData[0].phone) {
                var ob = user.contactData[0].phone;
                var d = {
                    type: "phone",
                    title: "Telefon",
                    annotation: annotate(ob),
                    value: ob.value,
                };
                array.push(d);
            }
        }
        function annotate(ob){
            if (ob.title) return ob.title;
        }
        var data = {
            contactData: array
        };


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