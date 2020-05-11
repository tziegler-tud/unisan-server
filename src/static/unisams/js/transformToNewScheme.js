

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
        function annotate(ob){
            if (ob.title) return ob.title;
        }
        var data = {
            generalData: {
                firstName: {
                    title: "Vorname",
                    value: user.firstName,
                },
                lastName: {
                    title: "Nachname",
                    value: user.lastName,
                },
                memberId: {
                    title: "Mitgliedsnummer",
                    value: user.generalData.memberId
                },
            },
            contactData: [],
        };

        if (user.email) {
            data.contactData.push({type: "email", title: "Email (restore)", value: user.email});
        }


        $.ajax({
            url: "/unisams/usermod/" + userId,
            // make put for safety reasons :-)
            type: 'PUT',
            dataType: 'json',
            data: data,
            success: function(result) {
                alert("success");
            }
        });
    });
}
