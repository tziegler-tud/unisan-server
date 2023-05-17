var systemActions = {

    rebuildAcl: function() {
        return $.ajax({
            url: "/api/v1/acl/updateAllUser",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        });
    },
}

export {systemActions}