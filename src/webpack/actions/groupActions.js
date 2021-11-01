

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
                location.replace("/unisams/settings/roles/"+result.id)
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
                location.replace("/unisams/settings/roles/"+result.id)
            }
        });
    },

    removeGroup: function(id, args) {
        $.ajax({
            url: "/api/v1/groups/"+id,
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            success: function (result) {
                location.replace("/unisams/settings/roles")
            }
        });
    },

    addUser: function(data, args) {
        let jsonData = {
            userGroupId: data.userGroupId,
            userId: data.userId,
            args: args,
        }
        $.ajax({
            url: "/api/v1/usermod/addUserGroup/"+data.userId,
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/unisams/settings/roles/"+data.userGroupId)
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
                location.replace("/unisams/settings/roles/"+userGroupId)
            }
        });
    },

    addPermission: function(userGroupId, data, args) {
        let jsonData = {
            userGroupId: userGroupId,
            method: data.method,
            url: data.url,
            args: args,
        }
        $.ajax({
            url: "/api/v1/groups/addPermission/"+userGroupId,
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/unisams/settings/roles/"+userGroupId+"/advanced");
            }
        });
    },

    updatePermission: function(userGroupId, data, args) {
        let jsonData = {
            userGroupId: userGroupId,
            currentMethod: data.current.method,
            currentUrl: data.current.url,
            newMethod: data.new.method,
            newUrl: data.new.url,
            args: args,
        }
        $.ajax({
            url: "/api/v1/groups/addPermission/"+userGroupId,
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(jsonData),
            success: function (result) {
                location.replace("/unisams/settings/roles/"+userGroupId+"/advanced");
            }
        });
    }
}

export {groupActions}