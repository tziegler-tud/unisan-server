var actions = {
    getLogs: function(targetId, logType, callback) {
        callback = (callback == null) ? function(){} : callback;
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
            success: function(result) {
                callback.onSuccess(result);

            }
        });
    },

    http: function(url, method="GET", data={}, callback) {
        callback = (callback == null) ? function(){} : callback;
        if(!url) return false;
        return $.ajax({
            url: url,
            type: method,
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
        });
    },
}

export {actions}