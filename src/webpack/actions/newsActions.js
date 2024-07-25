
var newsActions = {
    get: function(id, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        return $.ajax({
            url: "/api/v1/news/get/"+id,
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },

    create: function(data, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        var postData = data;
        return $.ajax({
            url: "/api/v1/news/add/",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(postData),
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },

    save: function(id, data, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        var postData = data;
        return $.ajax({
            url: "/api/v1/news/update/" +id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(postData),
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },
    getAll: function(callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function(){}
        var postData = data;
        return $.ajax({
            url: "/api/v1/news/get",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            success: function(result) {
                callback.onSuccess(result);
            }
        });
    },

    getFiltered: function(filter, args, callback) {
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function () {
        }
        var postData = {
            filter: filter,
            args: args,
        }
        return $.ajax({
            url: "/api/v1/news/filter",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(postData),
            success: function (result) {
                callback.onSuccess(result);
            }
        });
    },

    delete: function(id, args, callback){
        if (callback === undefined) callback = {};
        if (callback.onSuccess === undefined) callback.onSuccess = function () {};
        if (callback.onFail === undefined) callback.onFail = function () {};
        var postData = {
            args: args,
        }
        return $.ajax({
            url: "/api/v1/news/" + id,
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(postData),
            success: function (result) {
                callback.onSuccess(result);
            },
            fail: function(result){
                callback.onFail(result);
            },
        });
    }
}
export {newsActions}