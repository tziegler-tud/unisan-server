

var groupActions = {

    addGroup: function(data, args) {
        let jsonData = {
            data: data,
            args: args,
        }
        $.ajax({
            url: "/api/v1/groups",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/system/roles/"+result.id)
            }
        });
    },

    changeGroup: function(id, data, args) {
        let jsonData = data;
        $.ajax({
            url: "/api/v1/groups/"+id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/system/roles/"+result.id)
            }
        });
    },

    removeGroup: function(id, args) {
        $.ajax({
            url: "/api/v1/groups/"+id,
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            success: function (result) {
                location.replace("/system/roles")
            }
        });
    },

    addUser: function(data, args) {
        let jsonData = {
            userGroupId: data.userGroupId,
            userId: data.userId,
            args: args,
        }
        return $.ajax({
            url: "/api/v1/usermod/addUserGroup/"+data.userId,
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/system/roles/"+data.userGroupId)
            }
        });
    },



    addGroupToAllUser: function(userGroupId, args) {
        let jsonData = {
            userGroupId: userGroupId,
            args: args,
        }
        $.ajax({
            url: "/api/v1/usermod/addGroupToAllUser",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/system/roles/"+userGroupId)
            }
        });
    },

    removeGroupFromAllUser: function(userGroupId, args) {
        let jsonData = {
            userGroupId: userGroupId,
            args: args,
        }
        $.ajax({
            url: "/api/v1/usermod/removeGroupFromAllUser",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/system/roles/"+userGroupId)
            }
        });
    },

    addPermission: function(userGroupId, data, args) {
        console.error("not implemented")
        return false;
        // let jsonData = {
        //     userGroupId: userGroupId,
        //     operation: data.operation,
        //     args: args,
        // }
        // $.ajax({
        //     url: "/api/v1/groups/addPermission/"+userGroupId,
        //     type: 'POST',
        //     contentType: "application/json; charset=UTF-8",
        //     dataType: 'json',
        //     data: JSON.stringify(jsonData),
        //     success: function (result) {
        //         location.replace("/system/roles/"+userGroupId+"/advanced");
        //     }
        // });
    },

    removePermission: function(userGroupId, data, args) {
        console.error("not implemented")
        return false;
        // let jsonData = {
        //     userGroupId: userGroupId,
        //     operation: data.operation,
        //     args: args,
        // }
        // $.ajax({
        //     url: "/api/v1/groups/removePermission/"+userGroupId,
        //     type: 'DELETE',
        //     contentType: "application/json; charset=UTF-8",
        //     dataType: 'json',
        //     data: JSON.stringify(jsonData),
        //     success: function (result) {
        //         location.replace("/system/roles/"+userGroupId+"/advanced");
        //     }
        // });
    }
}

export {groupActions}