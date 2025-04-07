var systemActions = {

    rebuildAcl: function() {
        return $.ajax({
            url: "/api/v1/acl/updateAllUser",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        });
    },
    getSystemSettings: function(){
        return $.ajax({
            url: "/api/v1/system/settings",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },



    getSettingsByKey: function(key){
        return $.ajax({
            url: "/api/v1/system/settings/"+key,
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    updateMailSettings(data){
        return $.ajax({
                url: "/api/v1/system/settings/mail",
                type: 'PUT',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data)
        })
    },

    stopMailService(){
        return $.ajax({
            url: "/api/v1/system/mail/stop",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
        })
    },

    restartMailService(){
        return $.ajax({
            url: "/api/v1/system/mail/restart",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
        })
    },

    getMailStatus(){
        return $.ajax({
            url: "/api/v1/system/mail/status",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    checkMailAccountExists(email){
        return $.ajax({
            url: "/api/v1/mail/user/"+ email,
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    createUserMailAccount(userid){
        return $.ajax({
            url: "/api/v1/mail/user/createUserAccount",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify({userid: userid}),
        })
    },

    createSystemMailAccount(address){
        return $.ajax({
            url: "/api/v1/mail/system/createSystemAccount",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify({address: address}),
        })
    },

    recreateSystemMailAccountToken(){
        return $.ajax({
            url: "/api/v1/mail/system/recreateSystemAccountToken",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    syncUserMailToken(userid){
        return $.ajax({
            url: "/api/v1/mail/user/recreateAccountToken",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify({userid: userid}),
        })
    },

    updateAuthSettings(data){
        return $.ajax({
                url: "/api/v1/system/settings/auth",
                type: 'PUT',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data)
        })
    },

    getOidcClients(){
        return $.ajax({
            url: "/api/v1/system/oidc/clients",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },
    getOidcClientSecret(clientId){
        return $.ajax({
            url: "/api/v1/system/oidc/secrets/" + clientId,
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    addOidcClient(data){
        const payload = {
            name: data.name,
            client_id: data.client_id,
            redirect_uris: data.redirect_uris,
            post_logout_redirect_uris: data.post_logout_redirect_uris,
            enabled: data.enabled,
        }
        return $.ajax({
            url: "/api/v1/system/oidc/clients/",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(payload),
        })
    },

    updateOidcClient(id, data){
        const payload = {
            name: data.name,
            client_id: data.client_id,
            redirect_uris: data.redirect_uris,
            post_logout_redirect_uris: data.post_logout_redirect_uris,
            enabled: data.enabled,
        }
        return $.ajax({
            url: "/api/v1/system/oidc/clients/"+id,
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(payload),
        })
    },

    removeOidcClient(id){
        return $.ajax({
            url: "/api/v1/system/oidc/clients/"+id,
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    updateOidcSettings({issuer, port, enabled}){
        const payload = {
            issuer: issuer,
            port: port,
            enabled: enabled
        }
        return $.ajax({
            url: "/api/v1/system/settings/oidc",
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(payload),
        })
    },
    stopOidcService(){
        return $.ajax({
            url: "/api/v1/system/oidc/stop",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
        })
    },
    restartOidcService(){
        return $.ajax({
            url: "/api/v1/system/oidc/restart",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
        })
    },

    getOidcStatus(){
        return $.ajax({
            url: "/api/v1/system/oidc/status",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    getOidcCookieSecrets: function(){
        return $.ajax({
            url: "/api/v1/system/oidc/cookies/secrets",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    /**
     *
     * @param secrets {String[]}
     * @returns {*}
     */
    setOidcCookieSecrets: function(secrets){
        const payload = {
            cookieSecrets: secrets,
        }
        return $.ajax({
            url: "/api/v1/system/oidc/cookies/secrets",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(payload),
        })
    },

    getUserSessions() {
        return $.ajax({
            url: "/api/v1/system/oidc/userSessions",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    removeUserSession(sessionId){
        return $.ajax({
            url: "/api/v1/system/oidc/userSessions/"+sessionId,
            type: 'DELETE',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    updateEventsTable(){
        return $.ajax({
            url: "/api/v1/dev/database/updateEvents",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    updateNewsTable(){
        return $.ajax({
            url: "/api/v1/dev/database/updateNews",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    setMemberIdSettings({mode, offset}){
        return $.ajax({
            url: "/api/v1/system/settings/members/memberid",
            type: "PUT",
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify({
                mode: mode,
                offset: offset
            })
        })
    },

    getMailApiKey(){
        return $.ajax({
            url: "/api/v1/system/mail/apiKey",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    getSystemMailAccountToken(){
        return $.ajax({
            url: "/api/v1/system/mail/systemAccountToken",
            type: 'GET',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
        })
    },

    setMailApiKey(key){
        return $.ajax({
            url: "/api/v1/system/mail/apiKey",
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify({apiKey: key})
        })
    }
}

export {systemActions}