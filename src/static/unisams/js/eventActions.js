common = window.common;
(function (actions,$,undefined) {

    actions.addEvent = function(args) {

        var startDate = parseHTMLInputDate(args.date, args.startTime);
        var endDate = parseHTMLInputDate(args.date, args.endTime);

        var data = {
            title: {
                title: "Bezeichnung",
                value: args.title,
            },
            type: {
                title: "Art",
                value: args.type,
            },
            description: {
                shortDesc: args.shortDesc,
                longDesc: args.longDesc,
            },
            date: {
                startDate: startDate,
                endDate: endDate,
            },
        };

        $.ajax({
            url: "/unisams/eventmod/create",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                location.replace("/unisams/events")
            }
        });
    };

    actions.deleteEvent = function(userid) {

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

    function parseHTMLInputDate(date, time){
        //date is of form YYYY-MM-DD
        //TODO: make this more robust
        var dateYear = date.substr(0,4);
        var dateMonth = parseInt(date.substr(5,2))-1; //months are 0-based in js date
        var dateDay = date.substr(8,2);

        //time is of form hh:mm
        var timeHours = time.substr(0,2);
        var timeMinutes = time.substr(3,2);

        var d = new Date();
        d.setFullYear(dateYear);
        d.setMonth(dateMonth);
        d.setDate(dateDay);
        d.setHours(timeHours);
        d.setMinutes(timeMinutes);
        d.setSeconds(0);

        return d;
    }

}(actions = window.actions || {},jQuery));