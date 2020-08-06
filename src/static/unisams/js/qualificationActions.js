common = window.common;
(function (qualificationActions,$,undefined) {

    qualificationActions.removeDBKey = function(keyIdentifier, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            qualType: value.qualType,
            name: value.name
        };

        if(args) for(var k in args) data[k]=args[k];

        $.ajax({
            url: '/api/v1/qualification/'+keyIdentifier,
            // make put for safety reasons :-)
            type: 'DELETE',
            dataType: 'json',
            data: data,
            success: function(result) {
                callback();
            }
        });
    };

    qualificationActions.updateDBKey = function(keyIdentifier, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            qualType: value.qualType,
            name: value.name
        };

        if(args) for(var k in args) data[k]=args[k];

        $.ajax({
            url: '/api/v1/qualification/'+keyIdentifier,
            // make put for safety reasons :-)
            type: 'PUT',
            dataType: 'json',
            data: data,
            success: function(result) {
                callback()
            }
        });
    };

    qualificationActions.insertDBKey = function(keyIdentifier, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            qualType: value.qualType,
            name: value.name
        };

        if(args) for(var k in args) data[k]=args[k];

        $.ajax({
            url: '/api/v1/qualification/create',
            type: 'POST',
            dataType: 'json',
            data: data,
            success: function(result) {
                callback();
            }
        });
    };

}(qualificationActions = window.qualificationActions || {},jQuery));