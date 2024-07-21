export default {
    removeQualification: function(qualificationId, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = {
            qualType: value.qualType,
            name: value.name
        };

        if(args) for(var k in args) data[k]=args[k];

        $.ajax({
            url: '/api/v1/qualification/'+qualificationId,
            // make put for safety reasons :-)
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback();
            }
        });
    },

    updateQualification: function(qualificationId, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = value;
        if(args) for(var k in args) data[k]=args[k];

        $.ajax({
            url: '/api/v1/qualification/'+ qualificationId,
            // make put for safety reasons :-)
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback()
            }
        });
    },

    addQualification: function(value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var data = value;
        if(args) for(var k in args) data[k]=args[k];

        $.ajax({
            url: '/api/v1/qualification/create',
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                callback();
            }
        });
    },

    /**
     *
     * @returns {jQuery.jqXHR}
     */
    getGrouped: function(){
        return $.ajax({
            url: "/api/v1/qualification/groupByType",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
        })
    }
}