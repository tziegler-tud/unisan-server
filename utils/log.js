import bcrypt from 'bcrypt';
import db from '../schemes/mongo.js';

const UserGroup = db.UserGroup;
const dbLog = db.Log;
const User = db.User;

/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */

/** @typedef {String} LogType */

let logTypeEnum = [
    "activity",
    "modification",
    "server",
    "other",
]

let logTypeMap = {
    "server": 1,
    "activity": 2,
    "modification": 3,
    "other": 4,
}

class Log {
    /**
     * constructor log object
     * @param args {type: {LogType}, action: {objectType: {String}, actionType: {String}, actionDetail: {String}}, etc} constructor args
     */
    constructor(args) {
        //defaults
        args = (args === undefined) ? {}:args;
        this.action = (args.action === undefined) ? {}:args.action;
        this.target = (args.target === undefined) ? {}:args.target;
        this.httpRequest = (args.httpRequest === undefined) ? {}:args.httpRequest;
        this.authorizedUser = (args.authorizedUser === undefined) ? {}:args.authorizedUser;

        this.target.targetObjectId = this.target.targetObject;

        args.type  = (args.type === undefined) ? {}:args.type;
        switch(logTypeMap[args.type]) {
            case 1:
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                break;
            default:
                args.type = "other"
                break;
        }
        this.type = args.type;

        return this;
    }

    /**
     * set type
     * @param type {LogType}
     */
    setType(type){
        this.type = type;
    }

    /**
     * set action
     * @param objectType {String} type of object the action is targeted at
     * @param actionType {String} type of the action
     * @param actionDetail {String} a more informative description combinin objectType and actionType. Used for querying log db. optional.
     */

    setAction(objectType, actionType, actionDetail){
        this.action = {
            objectType: objectType,
            actionType: actionType,
            actionDetail: actionDetail,
        }
    }

    /**
     * sets log entry target
     * @param targetType {String} String containing Schema name of target object type.
     * @param target {id} Mongo reference id of target object
     * @param targetModel {String} mongoose scheme name referencing the SchemaType of targetObject
     */
    setTarget(targetType, target, targetModel){
        this.target = {
            targetType: targetType,
            targetObject: target,
            targetModel: targetModel
        }
    }

    /**
     * returns a json representation of the log object. Use this to save object to db.
     *
     * @returns {{action: {}, httpRequest: {}, type: *, authorizedUser: {}, target: {}}}
     */

    toJson(){
        let json = {
            type: this.type,
            action: this.action,
            target: this.target,
            authorizedUser: this.authorizedUser,
            httpRequest: this.httpRequest,
            logType: this.type,
        };
        return json;
    }

}

export default Log;

