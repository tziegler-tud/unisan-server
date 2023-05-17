
import {groupActions} from "./groupActions"
import {userActions} from "./userActions"
import {eventActions} from "./eventActions"
import {qualificationActions} from "./qualificationActions"
import {systemActions} from "./systemActions.js"

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
    }

}

export {actions, groupActions, userActions, eventActions, qualificationActions, systemActions}