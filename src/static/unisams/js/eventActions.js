common = window.common;
(function (actions,$,undefined) {
    (function (events,$,undefined) {

        events.addEvent = function(args) {

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
                    shortDesc: {value: args.shortDescVal, delta: args.shortDescDelta},
                    longDesc: {value: args.longDescVal, delta: args.longDescDelta},
                },
                location: {
                    title: "Adresse",
                    value: args.location,
                },
                date: {
                    startDate: startDate,
                    endDate: endDate,
                },
            };

            $.ajax({
                url: "/api/v1/eventmod/create",
                // make put for safety reasons :-)
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result) {
                    location.replace("/events")
                }
            });
        };

        events.deleteEvent = function(eventid) {

            // build a json object or do something with the form, store in data
            $.ajax({
                url: "/api/v1/eventmod/" + eventid,
                type: 'DELETE',
                success: function(result) {
                    alert("Event " + eventid + " deleted.");
                    window.location.replace("/events");
                }
            });

        };

        events.uploadImage = function(eventid){
            $.ajax({
                url: "/api/v1/eventmod/" + eventid + "/uploadUserImage",
                type: 'POST',
                success: function(result) {
                    alert("Event " + eventid + " image updated");
                    window.location.replace("/events/view/" + eventid);
                }
            });
        };

        events.addParticipant = function(eventid, userid, callback){
            callback = (callback == null) ? function(){} : callback;
            var data = {
                id: eventid,
                userId: userid,
                args: {},
            };
            $.ajax({
                url: "/api/v1/eventmod/addParticipant",
                // make put for safety reasons :-)
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result) {
                    callback();
                    window.location.reload();
                }
            });
        };

        events.changeParticipant = function(eventid, userid, role, callback){
            callback = (callback == null) ? function(){} : callback;
            var data = {
                id: eventid,
                userId: userid,
                role: role,
                args: {},
            };
            $.ajax({
                url: "/api/v1/eventmod/changeParticipant",
                // make put for safety reasons :-)
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result) {
                    callback();
                    window.location.reload();
                }
            });
        };

        events.removeParticipant = function(eventid, userid, callback){
            callback = (callback == null) ? function(){} : callback;
            var data = {
                id: eventid,
                userId: userid,
                args: {},
            };
            $.ajax({
                url: "/api/v1/eventmod/removeParticipant",
                // make put for safety reasons :-)
                type: 'POST',
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

        events.saveDelta = function(id, delta, callback){
            if (callback === undefined) callback = {};
            if (callback.onSuccess === undefined) callback.onSuccess = function(){}
            var data = {
                key: "description.longDesc.delta",
                value: delta,
            };
            $.ajax({
                url: "/api/v1/eventmod/updateKey/" +id,
                type: 'PUT',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result) {
                    callback.onSuccess(result);
                }
            });
        }

        events.updateDate = function(id, args, callback) {
            if (callback === undefined) callback = {};
            if (callback.onSuccess === undefined) callback.onSuccess = function(){}

            var startDate = parseHTMLInputDate(args.date, args.startTime);
            var endDate = parseHTMLInputDate(args.date, args.endTime);

            let data = {
                key: "date",
                value: {
                    startDate: startDate,
                    endDate: endDate,
                }
            }
            $.ajax({
                url: "/api/v1/eventmod/updateKey/" +id,
                type: 'PUT',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result) {
                    callback.onSuccess(result);
                }
            });
        }

        events.updateKey = function(id, key, value, callback){
            if (callback === undefined) callback = {};
            if (callback.onSuccess === undefined) callback.onSuccess = function(){}
            var data = {
                key: key,
                value: value,
            };
            $.ajax({
                url: "/api/v1/eventmod/updateKey/" +id,
                type: 'PUT',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(result) {
                    callback.onSuccess(result);
                }
            });
        }
        events.uploadFileToStorage = function(id, filename, file, callback){
            $.ajax({
                url: "/api/v1/eventmod/" + id + "/uploadFile",
                type: 'POST',
                success: function(result) {
                    return result;
                }
            });

        }

        events.deleteFileFromStorage = function(id, uniqueFileId, callback) {
            if (callback === undefined) callback = {};
            if (callback.onSuccess === undefined) callback.onSuccess = function(){}
            $.ajax({
                url: "/api/v1/eventmod/" + id + "/uploadFile",
                type: 'DELETE',
                contentType: 'text/plain',
                data: uniqueFileId,
                success: function(result) {
                    callback.onSuccess(result);
                }
            });
        }
        return events;
    }(actions.events = actions.events || {},jQuery));
}(actions = window.actions || {},jQuery));