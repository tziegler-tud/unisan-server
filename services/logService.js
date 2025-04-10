import db from '../schemes/mongo.js';
import mongoose from "mongoose";
import AuthService from './authService.js';
import Log from '../utils/log.js';

const UserGroup = db.UserGroup;
const User = db.User;
const dbLog = db.Log;



export default {
    getAll,
    getById,
    create,
    delete: _delete,
    deleteAll: _deleteAll,
    getTargetLogs,
    getAllFiltered,
    getTargetLogsById,
};

/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */
/** @typedef {import("../schemes/eventScheme.js").EventScheme} EventScheme */
/** @typedef {import("../utils/log.js").Log} Log */

/**
 * Gets all log entries
 */
async function getAll() {
    return dbLog.find().populate({
        path: 'authorizedUser',
        select: 'generalData username',
    }).sort({"timestamp": -1});
}

/**
 * @param complexFilterObject {Object[]} array of universal mongodb filters object to be applied to query
 * @param args {Object}
 * @param args.sort {Object} mongoose sort object - can be a simple string to sort for a property, or an object according to docs
 * @param args.or {Boolean} if set to true, filters will be applied with as OR. False for AND
 * @param args.limit {Number} limit results to specified number
 *
 * @returns {Promise<void>}
 */
async function getAllFiltered(complexFilterObject, args){
    let loglist;
    //we allow complex filtering with this function.
    complexFilterObject = (complexFilterObject === undefined) ? {} : complexFilterObject;
    args = (args === undefined) ? {} : args;
    let defaultArgs = {
        sort: {"timestamp": -1},
        or: false,
    }
    args = Object.assign(defaultArgs, args);

    //parse filters to Mongo format
    let filterArray = [];

    complexFilterObject.forEach(function(filter) {
        let universalFilter = {};
        if (filter.filter === undefined || filter.value === undefined) {
            //invalid, ignore entry
        }
        else {
            universalFilter[filter.filter] = filter.value;
            filterArray.push(universalFilter);
        }
    })

    //apply filter
    loglist = dbLog.find();
    if(filterArray.length > 0) {
        if(args.or) {
            loglist = loglist.or(filterArray)
        }
        else {
            loglist = loglist.and(filterArray);
        }
    }

    loglist.populate({
        path: 'authorizedUser',
        select: 'generalData username',
    });

    if (args.sort) {
        loglist = loglist.sort(args.sort);
    }
    if(args.limit) {
        loglist = loglist.limit(args.limit)
    }

    return loglist;



}

/**
 * Gets a log entry by its id
 * @param {id} id id of the event
 */
async function getById(id) {
    return dbLog.findById(id).populate({
        path: 'authorizedUser',
        select: 'generalData username',
    }).sort({"timestamp": -1});
}


/**
 * Creates a new log entry from log object and saves it to the db
 * @param {Log} log The object to save as event
 */
async function create(log) {
    //validation

    //save log
    try {
        let dbLogObj = new dbLog(log.toJson());
        await dbLogObj.save();
    }
    catch(err){
        console.error("Failed to create log entry: " + err);
    }
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
        }).sort({"timestamp": -1});
    }
    else {
        return dbLog.find({logType: logType, "target.targetObject": target.id}).populate({
            path: 'authorizedUser',
            select: 'generalData username',
        }).populate({
            path: 'target.targetObject',
            select: "username"
        }).sort({"timestamp": -1});
    }
}

/**
 * gets all logs for a specific target, given the target id
 *
 * @param targetId {id} target id
 * @param logType {String} String containing logType to be retrieved. Valid options are <"ALL","MODIFICATION","ACTIVITY","SERVER","OTHER">
 * @returns {Promise<void>}
 */
async function getTargetLogsById(targetId, logType){
    let id = new mongoose.Types.ObjectId(targetId);

    if (logType === undefined || logType === "ALL"){
        return dbLog.find({"target.targetObject": targetId}).populate({
            path: 'authorizedUser',
            select: 'generalData username',
        }).populate({
            path: 'target.targetObject',
            select: "username"
        }).sort({"timestamp": -1});
    }
    else {
        let filter = {};
        if (Array.isArray(logType)){
            filter = {
                logType: logType,
                "target.targetObject": {$in: logType}
            }
        }
        else {
            filter = {
                logType: logType,
                "target.targetObject": id
            }
        }
        return dbLog.find({logType: logType, "target.targetObject": id}).populate({
            path: 'authorizedUser',
            select: 'generalData username',
        }).populate({
            path: 'target.targetObject',
            select: "username"
        }).sort({"timestamp": -1});
    }

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
    await dbLog.findByIdAndRemove(id);
    return true;
}

/**
 * Deletes a log entry
 * @param req {Object} express request
 * @param {number} id id of log to delete
 */
async function _deleteAll() {
    return dbLog.deleteMany()
}