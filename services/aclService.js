const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');
const AuthService = require("./authService");
const Log = require("../utils/log");
const LogService = require("./logService");

const UserGroup = db.UserGroup;
const UserACL = db.userACL;
const User = db.User;

/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */

let rolesMap = {
    "protected": -1,
    "member": 1,
    "admin": 2,
    "superadmin": 3,
}

let rolesEnum = {
    PROTECTED: "protected",
    MEMBER: "member",
    ADMIN: "admin",
    SUPERADMIN: "superadmin",
}

let roles = [
    "protected",
    "member",
    "admin",
    "superadmin",
]

module.exports = {
    getAll,
    createUserACL,
    getUserACL,
    getUserRole,
    setUserRole,
    addUserGroup,
    removeUserGroup,
    remove,
    update,

};



async function getAll (req) {
    return UserACL.find();
}


async function getUserACL (req, userid) {
    let user = await User.findById(userid).select('-hash');
    let userACL = await UserACL.find({user: userid});

    // validate
    if (!user) throw new Error('User not found');
    if (!userACL) throw new Error('User AccessControlList not found');
    //check write access
    if(!AuthService.checkUserRightsReadAccess(req.user, user)) {
        //reject({status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."})
        throw {status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."};
    }
    return userACL;
}

async function createUserACL (req, userid, data, overwrite) {
    if (overwrite === undefined) overwrite = false;
    let defaultData = {
        userRole: "member",
        userGroups: [],
        individual: {
            events: [],
        }
    }
    data = (data === undefined) ? {}: data;
    Object.assign(defaultData, data);

    //check if user already has ACL
    let userACL = await UserACL.find({user: userid});
    if (userACL) {
        //user already has acl
        console.log("trying to create acl, but acl for this user is already present. Checking overwrite parameter...")
        if (overwrite) {
            console.log("overwrite enabled. Replacing user acl with fresh one...");
            return createNewACL(userid);
        }
        else {
            console.log("overwrite disabled. returning present acl.")
            return userACL;
        }
    }
    else {
        return createNewACL(userid);
    }

    function createNewACL(userid) {
        console.log("creating new acl for user " + userid);
        let aclObj = data;
        aclObj.user = userid;
        const userACL = new UserACL(aclObj);
        return aclObj.save();
    }

}


async function getUserRole (req, userid) {
    let user = await User.findById(userid).select('-hash');
    let userACL = await UserACL.find({user: userid});

    // validate
    if (!user) throw new Error('User not found');
    if (!userACL) throw new Error('User AccessControlList not found');
    //check write access
    if(!AuthService.checkUserRightsReadAccess(req.user, user)) {
        //reject({status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."})
        throw {status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."};
    }
    return userACL.userRole;
}


async function setUserRole (req, userid, role) {
    let user = await User.findById(userid).select('-hash');
    let userACL = await UserACL.find({user: userid});

    // validate
    if (!user) throw new Error('User not found');
    if (!userACL) throw new Error('AccessControlList not found');
    //check write access
    if(!AuthService.checkUserRightsWriteAccess(req.user, user)) {
        //reject({status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."})
        throw {status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."};
    }
    else {
        let validRoles = AuthService.roles;
        // validate
        if(typeof(role) === 'string'){
            if(!validRoles.includes(role)){
                throw new Error("invalid role name");
            }
        }
        else {
            throw new TypeError("invalid data type: parameter 'role' expected to be string, but was" + typeof(role));
        }
        //cant set role higher than acting user role
        if (AuthService.rolesMap[role] > AuthService.rolesMap[req.user.userRole]){
            throw {status: 403, message: "insufficient access rights"};
        }
        //set new role
        userACL.userRole = role;
        return userACL.save()
            .then(user => {
                //create log
                let log = new Log({
                    type: "modification",
                    action: {
                        objectType: "user",
                        actionType: "modify",
                        actionDetail: "userRoleModify",
                        key: "",
                        value: role,
                    },
                    authorizedUser: req.user,
                    target: {
                        targetType: "user",
                        targetObject: user._id,
                        targetObjectId: user._id,
                        targetModel: "User",
                    },
                    httpRequest: {
                        method: req.method,
                        url: req.originalUrl,
                    }
                })
                LogService.create(log).then().catch();
            })
    }

}


async function addUserGroup(req, userid, userGroupId){
    let user = await User.findById(userid).select('-hash');
    let userACL = await UserACL.find({user: userid});

    // validate
    if (!user) throw new Error('User not found');
    if (!userACL) throw new Error('User AccessControlList not found');
    //check write access
    if(!AuthService.checkUserRightsWriteAccess(req.user, user)) throw {status: 403, message: "Fehler beim Bearbeiten des Nutzers: Sie haben keine Berechtigung, die Rechte dieses Nutzers zu bearbeiten."};

    let group = await UserGroup.findById(userGroupId);
    if (!group) throw new Error('UserGroup not found');

    return new Promise(function(resolve, reject){
        //check if user already has userGroup assigned
        if(userACL.userGroups.includes(userGroupId)){
            console.log("User " + user.username + " already has UserGroup " + group.title + " assigned.");
            resolve(userACL);
        }
        else {
            userACL.userGroups.push(userGroupId);
            userACL.save()
                .then( user => {
                    resolve(userACL);
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userGroupAdd",
                            key: "",
                            value: group.title
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        }
    })
}

async function removeUserGroup(req, id, userGroupId){
    let user = await User.findById(id).select('-hash');
    let userACL = await UserACL.find({user: id});

    // validate
    if (!user) throw new Error('User not found');
    if (!userACL) throw new Error('User AccessControlList not found');
    //check write access
    if(!AuthService.checkUserRightsWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    let group = await UserGroup.findById(userGroupId);
    if (!group) throw new Error('invalid user group');


    //check if user has userGroup assigned
    let index = userACL.userGroups.indexOf(userGroupId);

    return new Promise(function(resolve, reject){
        //check if user has userGroup assigned
        let index = userACL.userGroups.indexOf(userGroupId);
        if(index > -1){
            // remove group
            userACL.userGroups.splice(index, 1);
            userACL.save()
                .then( user => {
                    resolve(user);
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userGroupDelete",
                            key: "",
                            value: group.title,
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        }
        else {
            console.log("Failed to remove user from group: User " + user.username + " is not part of group " + group.title);
            resolve(userACL);
        }
    })
}

async function remove(req, id) {
    return UserACL.findByIdAndDelete(id);
}

async function update(req, id, data) {
    return false;
}