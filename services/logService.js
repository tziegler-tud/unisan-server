const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');
const log = require('../utils/log');
const AuthService = require('./authService');

const UserGroup = db.UserGroup;
const User = db.User;
const dbLog = db.Log;



module.exports = {
    getAll,
    getById,
    create,
    delete: _delete,
    getTargetLogs,
    getTargetLogsById,
    addModelUser,
};

/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */
/** @typedef {import("../schemes/eventScheme.js").EventScheme} EventScheme */
/** @typedef {import("../utils/log.js").Log} Log */

/**
 * Gets all log entries
 */
async function getAll() {
    let logs = await dbLog.find().populate({
        path: 'authorizedUser',
        select: 'generalData username',
    });
    return logs;
}

/**
 * Gets a log entry by its id
 * @param {id} id id of the event
 */
async function getById(id) {
    return dbLog.findById(id).populate({
        path: 'authorizedUser',
        select: 'generalData username',
    })
}


/**
 * Creates a new log entry from log object and saves it to the db
 * @param {Log} log The object to save as event
 */
async function create(log) {
    //validation

    //save log
    let dbLogObj = new dbLog(log.toJson());
    await dbLogObj.save();
}

/**
 * gets all logs for a specific target
 *
 * @param target {Object} target
 * @param logType {String} String containing logType to be retrieved. Valid options are <"ALL","MODIFICATION","ACTIVITY","SERVER","OTHER">
 * @returns {Promise<void>}
 */
async function getTargetLogs(target, logType){

    if (logType === undefined || logType === "ALL"){
        return dbLog.find({"target.targetObject": target.id}).populate({
            path: 'authorizedUser',
            select: 'generalData username',
        }).populate({
            path: 'target.targetObject',
            select: "username"
        });
    }
    dbLog.find({logType: logType, "target.targetObject": target.id}).populate({
        path: 'authorizedUser',
        select: 'generalData username',
    }).populate({
        path: 'target.targetObject',
        select: "username"
    });
}

/**
 * gets all logs for a specific target, given the target id
 *
 * @param targetId {id} target id
 * @param logType {String} String containing logType to be retrieved. Valid options are <"ALL","MODIFICATION","ACTIVITY","SERVER","OTHER">
 * @returns {Promise<void>}
 */
async function getTargetLogsById(targetId, logType){

    if (logType === undefined || logType === "ALL"){
        return dbLog.find({"target.targetObject": targetId}).populate({
            path: 'authorizedUser',
            select: 'generalData username',
        }).populate({
            path: 'target.targetObject',
            select: "username"
        });
    }
    return dbLog.find({logType: logType, "target.targetObject": targetId}).populate({
        path: 'authorizedUser',
        select: 'generalData username',
    }).populate({
        path: 'target.targetObject',
        select: "username"
    });
}

async function getEventLogs(event, type){

}


/**
 * Deletes a log entry
 * @param req {Object} express request
 * @param {number} id id of log to delete
 */
async function _delete(req, id) {
    let log = await dbLog.findById(id)
    // validate
    if (!log) throw new Error('Log not found');
    //check write access
    if(!AuthService.checkRequiredRole(req.user, AuthService.rolesEnum.SUPERADMIN)) throw {status: 403, message: "forbidden"};
    await dbLog.findByIdAndRemove(id);
    return true;
}



async function addModelUser(){
    let logs = await dbLog.find();
    logs.forEach(function(log){
        log.target.targetModel = "User";
        log.save();
    })
}
