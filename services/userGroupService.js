import bcrypt from 'bcrypt';
import db from '../schemes/mongo.js';
import AuthService from './authService.js';
import LogService from "./logService.js";
import aclService from "./aclService.js";
import UserService from "./userService.js";
import Log from '../utils/log.js';


const UserGroup = db.UserGroup;

/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */

export default {
    getAll,
    getById,
    update,
    create,
    _delete,
    addPermission,
    removePermission,
    getAssignedUser,
};


async function getAll(){
    return UserGroup.find();
}


/**
 * Gets an event by its id
 * @param {number} id id of the event
 */
async function getById(id) {
    return UserGroup.findById(id);
}

/**
 * Gets an event by its title
 * @param {String} title
 */
async function getByTitle(title) {
    return UserGroup.find({title: title});
}

/**
 * Creates a new group from qualified JSON object
 * @param {Object} req request object
 * @param {UserGroup} groupObject
 * @þaram {Object} args
 */
async function create(req, groupObject, args) {
    // create group document
    let data = groupObject;
    groupObject.default = false;
    const group = new UserGroup(groupObject);
    // save in database
    return group.save()
        .then(result => {
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "userGroup",
                    actionType: "add",
                    actionDetail: "groupAdd",
                    key: group.title,
                    value: "",
                },
                authorizedUser: req.user,
                target: {
                    targetType: "userGroup",
                    targetObject: group._id,
                    targetObjectId: group._id,
                    targetModel: "UserGroup",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
            LogService.create(log).then().catch();
        })
}


/**
 * Updates an existing group
 *
 * @param {Object} req request object
 * @param {number} id groupId
 * @param {UserGroup} groupObject
 * @param {Boolean} allowDefaultOverwrite must be true to modify default groups
 */
async function update(req, id, groupObject, allowDefaultOverwrite) {
    if (allowDefaultOverwrite === undefined) allowDefaultOverwrite = false;
    return new Promise(function(resolve, reject){
        let msg = "Failed to update group: ";
        const group = UserGroup.findById(id)
            .then(result => {
                // validate
                if (group.default && !allowDefaultOverwrite) reject(msg + "Overwriting default roles is not allowed.")
                // copy qualParam properties to qualification document
                Object.assign(group, groupObject);
                group.save()
                    .then(group=>{
                        resolve(result);
                        let log = new Log({
                            type: "modification",
                            action: {
                                objectType: "userGroup",
                                actionType: "modify",
                                actionDetail: "groupModify",
                                key: group.title,
                                value: "",
                            },
                            authorizedUser: req.user,
                            target: {
                                targetType: "userGroup",
                                targetObject: undefined,
                                targetObjectId: group._id,
                                targetModel: "UserGroup",
                            },
                            httpRequest: {
                                method: req.method,
                                url: req.originalUrl,
                            }
                        })
                        LogService.create(log).then().catch();
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
            .catch(err => {
                reject(msg + err)
            })

    })

}

/**
 * Deletes a group
 * @param {Object} req request object
 * @param {number} id The id of the group to delete
 * @param {Boolean} allowDefaultOverwrite must be true to modify default groups
 */
async function _delete(req, id, allowDefaultOverwrite) {
    if (allowDefaultOverwrite === undefined) allowDefaultOverwrite = false;
    return new Promise(function(resolve, reject){
        let msg = "Failed to delete group: ";
        //check if default
        UserGroup.findById(id)
            .then(group => {
                if(group.default && !allowDefaultOverwrite) reject(msg + "Deleting default roles is not allowed.")
                else {
                    removeGroupFromAllUser(req, id)
                        .then(function(result){
                            UserGroup.findByIdAndRemove(id)
                                .then(function(result){
                                    resolve(result);
                                    let log = new Log({
                                        type: "modification",
                                        action: {
                                            objectType: "userGroup",
                                            actionType: "delete",
                                            actionDetail: "groupRemove",
                                            key: group.title,
                                            value: "",
                                            tag: "<DELETE>"
                                        },
                                        authorizedUser: req.user,
                                        target: {
                                            targetType: "userGroup",
                                            targetObject: group._id,
                                            targetObjectId: group._id,
                                            targetModel: "UserGroup",
                                            targetState: "DELETED"
                                        },
                                        httpRequest: {
                                            method: req.method,
                                            url: req.originalUrl,
                                        }
                                    })
                                    LogService.create(log).then().catch();
                                })
                                .catch(err => {
                                    reject(msg + err);
                                })
                        })
                        .catch(function(err){
                            reject(msg + err)
                        });
                }

            })

    })

}

/**
 * adds a permission to a group
 * @param {Object} req request object
 * @param {number} id group id
 * @param {String} newOperation operation string. use authEnums
 * @param {Boolean} allowDefaultOverwrite must be true to modify default groups
 */

async function addPermission(req, id, newOperation, allowDefaultOverwrite) {
    let errmsg = "Failed to update Group operation. "
    const group = await UserGroup.findById(id);
    // validate
    if (group == null) throw new Error('Group not found');
    if (group.default && !allowDefaultOverwrite) {
        throw new Error(errmsg + "Reason: Modifying default groups is not allowed.")
    }
    if(!AuthService.checkIfValidOperation(newOperation)){
        throw new Error(errmsg + "Reason: Invalid Operation")
    }

    group.allowedOperations.push(newOperation);
    return group.save()
        .then(group => {
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "userGroup",
                    actionType: "modify",
                    actionDetail: "groupAddPermission",
                    key: group.title,
                    value: newOperation,
                },
                authorizedUser: req.user,
                target: {
                    targetType: "userGroup",
                    targetObject: group._id,
                    targetObjectId: group._id,
                    targetModel: "UserGroup",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
            LogService.create(log).then().catch();
        })
}

/**
 * removes a permission
 * @param {Object} req request object
 * @param {number} id group id
 * @param {String} operation operation string. use authEnums
 * @param {Boolean} allowDefaultOverwrite must be true to modify default groups
 */

async function removePermission(req, id, operation, allowDefaultOverwrite) {
    let errmsg = "Failed to update Group operation. "
    const group = await UserGroup.findById(id);
    // validate
    if (group == null) throw new Error('Group not found');
    if (group.default && !allowDefaultOverwrite) {
        throw new Error(errmsg + "Reason: Modifying default groups is not allowed.")
    }

    if(!AuthService.checkIfValidOperation(operation)){
        throw new Error(errmsg + "Reason: Invalid Operation")
    }

    //find object in array
    let index = group.allowedOperations.findIndex(function(v){
        return (v === operation);
    });

    if (index > -1){
        //remove
        group.allowedOperations.splice(index, 1);
    }
    else {
        throw new Error("operation not found.")
    }
    return group.save()
        .then(group => {
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "userGroup",
                    actionType: "modify",
                    actionDetail: "groupRemovePermission",
                    key: group.title,
                    value: operation,
                },
                authorizedUser: req.user,
                target: {
                    targetType: "userGroup",
                    targetObject: group._id,
                    targetObjectId: group._id,
                    targetModel: "UserGroup",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
            LogService.create(log).then().catch();
        })
}

async function getAssignedUser(id) {
    return new Promise(function(resolve, reject)
    {
        UserGroup.findById(id)
            .then(function (group) {
                // validate
                if (group == null) {
                    reject('Group not found');
                    return;
                }

                else {
                    //query aclService to retrieve all acl documents
                    let args = {
                            filter: {
                                filter: "userGroups",
                                value: id
                            }
                        }
                    aclService.getAllFiltered(args)
                        .then(aclArray => {
                            //strip array from everything but user ids
                            let idArray = aclArray.map(acl => {
                                return acl.user;
                            })
                            //resolve users
                            UserService.getManyById(idArray)
                                .then(result => {
                                    resolve(result)
                                })
                                .catch(err => {
                                    reject(err)
                                })
                        })

                }

                // //query userService for user with this group assigned
                // let args = {
                //     filter: {
                //         filter: "userGroups",
                //         value: id
                //     }
                // }
                // UserService.getAllFiltered(args)
                //     .then(function(userArray){
                //         resolve(userArray);
                //     })
                //     .catch(err => reject(err))
            })
            .catch(function (err) {
                reject(err);
            })
    })
}

async function removeGroupFromAllUser(req, id){
    return new Promise(function(resolve, reject) {
        getAssignedUser(id)
            .then(function (userArray) {
                let promiseArray = [];
                if (!Array.isArray(userArray)) reject(new Error("Failed to read assigned users"))
                userArray.forEach(function (user) {
                    let promise = UserService.removeUserGroup(req, user._id, id);
                    promiseArray.push(promise)
                })
                Promise.all(promiseArray)
                    .then(function(array){
                        resolve(array)
                    })
            })
            .catch(function (err) {
                reject(err);
            })
    })
}
