
var newsActions = {
    create: function(data, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        var postData = {
            delta: data.delta,
            value: data.value,
        };
        return $.ajax({
            url: "/api/v1/news/add/" +id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(postData),
            success: function(result) {
                callback.onSuccess(result);
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
    saveContent: function(id, data, callback){
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

export {newsActions}