
var eventActions = {

    addEvent: function(args) {

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

        return $.ajax({
            url: "/api/v1/eventmod/create",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                if (result.id) {
                    location.replace("/unisams/events/" + result.id)
                }
                else location.replace("/unisams/events");
            }
        });
    },

    deleteEvent: function(eventid, callback) {
        callback = (callback == null) ? function(){
            alert("event " + eventid + " deleted.");
            window.location.replace("/unisams/events");
        } : callback;

        // build a json object or do something with the form, store in data
        return $.ajax({
            url: "/api/v1/eventmod/" + eventid,
            type: 'DELETE',
            success: function(result) {
                callback(result)
            }
        });
    },

    uploadImage: function(eventid){
        return $.ajax({
            url: "/api/v1/eventmod/" + eventid + "/uploadUserImage",
            type: 'POST',
            success: function(result) {
                alert("Event " + eventid + " image updated");
                window.location.replace("/unisams/events/view/" + eventid);
            }
        });
    },

    addParticipant: function(eventid, userid, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            id: eventid,
            userId: userid,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/addParticipant",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback(result);
                // window.location.reload();
            }
        });
    },

    changeParticipant: function(eventid, userid, role, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            id: eventid,
            userId: userid,
            role: role,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/changeParticipant",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback();
                // window.location.reload();
            }
        });
    },

    removeParticipant: function(eventid, userid, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            id: eventid,
            userId: userid,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/removeParticipant",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback(result);
            }
        });
    },

    addPosting: function(eventId, postingData, callback, args) {
        callback = (callback == null) ? function(){} : callback;

        var startDate = parseHTMLInputDate(args.date, args.startTime);
        var endDate = parseHTMLInputDate(args.date, args.endTime);

        postingData.date = {
            startDate: startDate,
            endDate: endDate,
        }

        var data = {
            id: eventId,
            posting: postingData,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/addPost",
            // make put for safety reasons :-)
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback(result);
                // window.location.reload();
            }
        });
    },

    updatePosting: function(eventId, postingData, callback, args) {
        callback = (callback == null) ? function(){} : callback;


        var startDate = parseHTMLInputDate(args.date, args.startTime);
        var endDate = parseHTMLInputDate(args.date, args.endTime);

        postingData.date = {
            startDate: startDate,
            endDate: endDate,
        }
        var data = {
            id: eventId,
            posting: postingData,
            args: {},
        };


        return $.ajax({
            url: "/api/v1/eventmod/updatePost",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback(result);
                // window.location.reload();
            }
        });
    },


    removePosting: function(eventId, postingId, callback) {
        callback = (callback == null) ? function(){} : callback;
        var data = {
            id: eventId,
            postingId: postingId,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/removePost",
            // make put for safety reasons :-)
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback(result);
                // window.location.reload();
            }
        });
    },

    assignPost: function(eventId, postingId, userId, callback) {
        callback = (callback == null) ? function(){} : callback;
        var data = {
            id: eventId,
            postingId: postingId,
            userId: userId,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/assignPost",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback(result);
                // window.location.reload();
            }
        });
    },

    unassignPost: function(eventId, postingId, userId, callback) {
        callback = (callback == null) ? function(){} : callback;
        var data = {
            id: eventId,
            postingId: postingId,
            userId: userId,
            args: {},
        };
        return $.ajax({
            url: "/api/v1/eventmod/unassignPost",
            // make put for safety reasons :-)
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback(result);
                // window.location.reload();
            }
        });

    },

    saveTitle: function(id, data, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        var postData = {
            delta: data.delta,
            value: data.value,
        };
        return $.ajax({
            url: "/api/v1/eventmod/updateTitle/" +id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(postData),
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },
    saveDescription: function(id, data, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        var postData = {
            longDesc: data.longDesc,
            shortDesc: data.shortDesc,
        }
        return $.ajax({
            url: "/api/v1/eventmod/updateDescription/" +id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(postData),
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },

    saveDelta: function(id, delta, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        var data = {
            key: "description.longDesc.delta",
            value: delta,
        };
        return $.ajax({
            url: "/api/v1/eventmod/updateKey/" +id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },

    updateDate: function(id, args, callback) {
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
        return $.ajax({
            url: "/api/v1/eventmod/updateKey/" +id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },

    updateKey: function(id, key, value, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        var data = {
            key: key,
            value: value,
        };
        return $.ajax({
            url: "/api/v1/eventmod/updateKey/" +id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },
    uploadFileToStorage: function(id, filename, file, callback){
        return $.ajax({
            url: "/api/v1/eventmod/" + id + "/uploadFile",
            type: 'POST',
            success: function(result) {
                return result;
            }
        });
    },

    deleteFileFromStorage: function(id, uniqueFileId, callback) {
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
    },
}

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
    d.setMilliseconds(0);

    return d;
}

export {eventActions}