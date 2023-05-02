import bcrypt from 'bcrypt';
import Mongoose from "mongoose";
import db from '../schemes/mongo.js';
import aclService from "./aclService.js";

const UserGroup = db.UserGroup;
const UserACL = db.UserACL;
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

let groupsEnum = {
    MEMBER: "member",
    USERADMIN: "userAdmin",
    EVENTADMIN: "eventAdmin",
    ACLADMIN: "aclAdmin",
    SYSADMIN: "systemAdmin"
}

let groupActionsEnum = {
    GRANT: "grantGroup",
    REVOKE: "revokeGroup",
}

let roles = [
    "protected",
    "member",
    "admin",
    "superadmin",
]

let operations = {
    user: {
        READ: "readUser", //read all user documents
        WRITE: "writeUser", //write all user documents
        CREATE: "createUser", //create user
        DELETE: "deleteUser", //delete user
        READSELF: "readUserSelf", //read own user document
        WRITESELF: "writeUserSelf", //write non-critical properties on own user docuemnt
    },
    events: {
        READ: "readEvent",
        WRITE: "writeEvent",
        CREATE: "createEvent",
        DELETE: "deleteEvent",
    },
    access: {
        READACL: "readAcl",
        WRITEACL: "writeAcl",

        READUSERROLE: "readUserRole",
        WRITEUSERROLE: "writeUserRole",

        GRANTUSERGROUPS: "grantUserGroups", //grant non-admin user groups
        REVOKEUSERGROUPS: "revokeUserGroups", //revoke non-admin user groups

        GRANTEVENTCONTROL: "grantEventControl",
        REVOKEEVENTCONTROL: "revokeEventControl",

        GRANTUSERADMINRIGHTS: "grantUserRights", //grant user admin rights to other users
        REVOKEUSERADMINRIGHTS: "revokeUserRights", //revoke user admin rights from other users

        GRANTEVENTADMINRIGHTS: "grantEventRights", //grant event admin rights to other users
        REVOKEEVENTADMINRIGHTS: "revokeEventRights", //revoke event admin rights from other users

        GRANTSYSTEMADMINRIGHTS: "grantSystemAdminRights", //grant system admin rights to other users
        REVOKESYSTEMADMINRIGHTS: "revokeSystemAdminRights", //revoke system admin rights from other users
    },
    groups: {
        READ: "readGroups",
        WRITE: "writeGroups",
        CREATE: "createGroups",
        DELETE: "deleteGroups",
    },
    settings: {
        QUALIFICATIONS: "manageQualificationSettings",
        LOGS: "manageSystemLogs",
        EVENTS: "manageEventSettings",
        USER: "manageUserSettings",
        GOUPS: "manageGroupSettings",
        SYSTEM: "manageSystemSettings",
    }
}

let defaultMember = {
    title: "member",
    description: "Standardgruppe für Nutzer. Erlaubt grundlegenden Systemzugriff.",
    default: true,
    type: "user",
    allowedOperations: [
        operations.user.READ,
        operations.user.READSELF,
        operations.user.WRITESELF,
        operations.events.READ,
    ],
}

let defaultUserAdmin = {
    title: "userAdmin",
    description: "Nutzer erstellen, bearbeiten und löschen",
    default: true,
    type: "useradmin",
    allowedOperations: [
        operations.user.READ,
        operations.user.WRITE,
        operations.user.CREATE,
        operations.user.DELETE,
        operations.access.GRANTUSERGROUPS,
        operations.access.REVOKEUSERGROUPS,

        operations.access.READACL,

        operations.settings.USER,
        operations.settings.QUALIFICATIONS,
    ]
}

let defaultEventAdmin = {
    title: "eventAdmin",
    description: "Events erstellen, bearbeiten und löschen",
    default: true,
    type: "eventadmin",
    allowedOperations: [
        operations.events.READ,
        operations.events.CREATE,
        operations.events.WRITE,
        operations.events.DELETE,
        operations.access.GRANTEVENTCONTROL,
        operations.access.REVOKEEVENTCONTROL,

        operations.settings.EVENTS,
    ]
}

let defaultAclAdmin = {
    title: "aclAdmin",
    description: "Zugriffsrechte bearbeiten",
    default: true,
    type: "system",
    allowedOperations: [
        operations.access.READUSERROLE,
        operations.access.WRITEUSERROLE,

        operations.access.GRANTEVENTCONTROL,
        operations.access.REVOKEEVENTCONTROL,

        operations.access.GRANTUSERGROUPS,
        operations.access.REVOKEUSERGROUPS,
        operations.access.GRANTUSERADMINRIGHTS,
        operations.access.REVOKEUSERADMINRIGHTS,
        operations.access.GRANTEVENTADMINRIGHTS,
        operations.access.REVOKEEVENTADMINRIGHTS,

        operations.access.READACL,
        operations.access.WRITEACL,

        operations.groups.READ,
        operations.groups.WRITE,
        operations.groups.CREATE,
        operations.groups.DELETE,

        operations.settings.GOUPS,
    ]
}

let defaultSysAdmin = {
    title: "systemAdmin",
    description: "Systemeinstellungen bearbeiten, Rechte vergeben",
    default: true,
    type: "system",
    allowedOperations: [
        operations.user.READ,
        operations.user.READSELF,
        operations.user.WRITESELF,
        operations.events.READ,

        operations.user.READ,
        operations.user.WRITE,
        operations.user.CREATE,
        operations.user.DELETE,
        operations.access.GRANTUSERGROUPS,
        operations.access.REVOKEUSERGROUPS,

        operations.events.READ,
        operations.events.CREATE,
        operations.events.WRITE,
        operations.events.DELETE,

        operations.access.READACL,
        operations.access.WRITEACL,

        operations.access.READUSERROLE,
        operations.access.WRITEUSERROLE,

        operations.access.GRANTEVENTCONTROL,
        operations.access.REVOKEEVENTCONTROL,

        operations.access.GRANTUSERGROUPS,
        operations.access.REVOKEUSERGROUPS,
        operations.access.GRANTUSERADMINRIGHTS,
        operations.access.REVOKEUSERADMINRIGHTS,
        operations.access.GRANTEVENTADMINRIGHTS,
        operations.access.REVOKEEVENTADMINRIGHTS,

        operations.access.GRANTSYSTEMADMINRIGHTS,
        operations.access.REVOKESYSTEMADMINRIGHTS,

        operations.groups.READ,
        operations.groups.WRITE,
        operations.groups.CREATE,
        operations.groups.DELETE,

        operations.settings.EVENTS,
        operations.settings.USER,
        operations.settings.LOGS,
        operations.settings.GOUPS,
        operations.settings.SYSTEM,
        operations.settings.QUALIFICATIONS,

    ]
}


let defaultGroups = [
    defaultMember,
    defaultUserAdmin,
    defaultEventAdmin,
    defaultAclAdmin,
    defaultSysAdmin,
]

class AuthService {
    constructor() {
        console.log("initializing authentication service...\n");
        let self = this;
        this.groups = defaultGroups;
        this.operations = operations;

        self.init = new Promise(function(resolve, reject){
            //might wanna do smt here later
            self.verifyDefaultRoles(true)
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    reject(err)
                })
        }).then(function(result){
            console.log("authentication service initialized succesfully.");
        }).catch(err => {
            let msg = "Authentication Service failed to initialize: Failed to verify default roles. Reason: "+ err;
            console.error(msg);
            process.exit(); //kill server
        })
    }



    auth (requestingUser, operation) {
        return this.checkAllowedGroupOperation(requestingUser, operation);
    }

    /**
     *
     * @param requestingUser {UserScheme} object or id of the requesting user
     * @param operation {String} String representation of requested operation. Use static enum AuthService.operations to obtain string.
     * @returns {Promise<Object|Error>}
     */
    checkAllowedGroupOperation(requestingUser, operation) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.init
                .then(result => {
                    let id = typeof(requestingUser) === "string" ? requestingUser : requestingUser.id;
                    // UserACL.findOne({user: id}).populate("userGroups")
                    aclService.getUserACL(id, true)
                        .then(function(userACL){
                            //check if superadmin
                            if (userACL.userRole === authService.rolesEnum.SUPERADMIN) {
                                console.log("authoprized by role: " + userACL.userRole); //debug TODO: remove once done testing
                                resolve({status: 200, message: "authorization successful"});
                            }
                            //check if a group allows the requested operation
                            let authGroup;
                            let allowed  = userACL.userGroups.some(function(group){
                                let match = group.allowedOperations.includes(operation);
                                if (match) {
                                    authGroup = group;
                                    return group;
                                }
                            })
                            if (allowed) {
                                console.log("authoritzed by group membership: " + authGroup.title); //debug TODO: remove once done testing
                                resolve({status: 200, message: "authorization successful"})
                            }
                            else {
                                //no access rights
                                let err = self.createForbiddenError("authorization failed for operation "+ operation)
                                reject(err)
                            }
                        })
                        .catch(err => {
                            let msg = "Error: Unable to get ACL assigned to requesting user. Details: "
                            throw new Error(msg + err);
                        })
                })
                .catch(err => {
                    let msg = "Failed to perform operation: Authentication Service has not been initialized";
                    reject(msg)
                })
        })
    }

    checkRoleAccess (user, target){
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");
        //get user role
        return new Promise(function(resolve, reject){
            let userACL = aclService.getUserRole(user);
            let targetACL = aclService.getUserRole(target);
            Promise.all([userACL, targetACL])
                .then(results => {
                    let userRole = results[0];
                    let targetRole = results[1];
                    //superadmin is allowed to perform any operation
                    if(userRole === rolesEnum.SUPERADMIN) resolve(userRole);
                    //operations on protected user are only allowed by superadmin
                    if (targetRole === rolesEnum.PROTECTED) reject("Access denied. Reason: target role: " + rolesEnum.PROTECTED);
                    //get user access level
                    let al = rolesMap[userRole];
                    //compare. must be greater or equal to allow operation
                    let write = (al >= rolesMap[targetRole]);

                    if  (write) {
                        resolve(userRole)
                    }
                    else {
                        reject("Access denied. Reason: Insufficient access level.");
                    }
                })
                .catch(err => {
                    throw new Error(err);
                })
        })
    }

    /**
     * authorizes basic write access on user documents. dont use this for critical properties, e.g. passwords or username
     *
     * @param user {UserScheme} requesting user
     * @param target {UserScheme} target user
     * @param critical {Boolean} forwards to critical security check
     * @returns {Promise<unknown>}
     */
    checkUserWriteAccess (user, target, critical) {
        let self = this;
        //validate
        if (user === undefined) throw new Error("AuthService fail: invalid parameters given");
        if (target === undefined) target = "other";
        let targetId = target;
        if (target.id !== undefined) targetId = target.id;
        if (critical) return self.checkUserWriteAccessCritical(user, target);

        return new Promise(function(resolve, reject){

            if(target === "self" || user.id.toString() === targetId.toString()) {
                //trying to write self
                self.checkAllowedGroupOperation(user, operations.user.WRITESELF)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
            else {
                //general user write access is required
                self.checkAllowedGroupOperation(user, operations.user.WRITE)
                    .then(group => {
                        resolve(group)
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
        })
    }

    /**
     * authorizes critical write access on user documents. Use this for critical properties, e.g. passwords or username
     *
     * @param user {UserScheme} requesting user
     * @param target {UserScheme} target user
     * @returns {Promise<unknown>}
     */
    checkUserWriteAccessCritical (user, target) {
        let self = this;
        //validate
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");
        let targetId = target;
        if (target.id !== undefined) targetId = target.id;

        return new Promise(function(resolve, reject){

            if(target === "self" || user.id.toString() === targetId.toString()) {
                //trying to write self
                self.checkAllowedGroupOperation(user, operations.user.WRITESELF)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
            else {
                //general user write access is required
                let writeAccess = self.checkAllowedGroupOperation(user, operations.user.WRITE)
                let accessLevel = self.checkRoleAccess(user, target);

                Promise.all([writeAccess, accessLevel])
                    .then(results => {
                        let group = results[0];
                        let accessLevel = results[1];
                        console.log("critical user write access granted by group: " + group.title + "and access level: " + accessLevel);
                        resolve(results)
                    })
                    .catch(err =>{
                        reject(err)
                    })

            }
        })
    }

    /**
     * authorizes delete access on user documents.
     *
     * @param user {UserScheme} requesting user
     * @param target {UserScheme} target user
     * @returns {Promise<unknown>}
     */
    checkUserDeleteAccess (user, target) {
        let self = this;
        //validate
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");
        let targetId = target;
        if (target.id !== undefined) targetId = target.id;

        return new Promise(function(resolve, reject){

            if(target === "self" || user.id.toString() === targetId.toString()) {
                //trying to delete self
                self.checkAllowedGroupOperation(user, operations.user.DELETE)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
            else {
                //general user delete access is required
                let writeAccess = self.checkAllowedGroupOperation(user, operations.user.DELETE)
                let accessLevel = self.checkRoleAccess(user, target);

                Promise.all([writeAccess, accessLevel])
                    .then(results => {
                        let group = results[0];
                        let accessLevel = results[1];
                        console.log("critical user write access granted by group: " + group.title + "and access level: " + accessLevel);
                        resolve(user);
                    })
                    .catch(err =>{
                        reject(err)
                    })

            }
        })
    }

    /**
     *
     * @param user {User} requesting user
     * @param target {ObjectId | User} target user
     * @param group {UserGroup} group to be added or revoked
     * @param grant {Boolean} grant = true, revoke = false
     * @returns {Promise<unknown>}
     */
    async checkUserGroupWriteAccess(user, target, group, grant) {
        let self = this;
        //validate
        if (user === undefined || target === undefined || group === undefined || group.type === undefined) throw new Error("AuthService fail: invalid parameters given");
        let targetId = target;
        if (target.id !== undefined) targetId = target.id;

        let granting = (grant === undefined || grant) ? groupActionsEnum.GRANT : groupActionsEnum.REVOKE;
        let groupOperation = self.getRequiredGroupOperation(group.type, granting);


        if(target === "self" || user.id.toString() === targetId.toString()) {
            //trying to write self
            let writeSelf = self.checkAllowedGroupOperation(user, operations.user.WRITESELF);

            let addGroup = self.checkAllowedGroupOperation(user, groupOperation)

                Promise.all([writeSelf, addGroup])
                    .then(result => {
                        return(result)
                })
                    .catch(err => {
                        throw err
                })
        }
        else {
            //general user write access is required
            let writeAccess = self.checkAllowedGroupOperation(user, operations.user.WRITE)
            let addGroup = self.checkAllowedGroupOperation(user, groupOperation)

            Promise.all([writeAccess, addGroup])
                .then(result => {
                    return(result)
                })
                .catch(err => {
                    throw err
                })

        }
    }

    /**
     * authorizes basic write access on target document. dont use this for critical properties, e.g. passwords or username
     *
     * @param user {UserScheme} requesting user
     * @param target {UserScheme} target user
     * @param targetType {String} target type identifier
     * @param critical {Boolean} forwards to critical security check
     * @returns {Promise<unknown>}
     */
    checkTargetWriteAccess (user, target, targetType, critical) {
        let self = this;
        //validate
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");
        // if (critical) return self.checkTargetWriteAccessCritical(user, target);

        switch(targetType) {
            case "user":
                return self.checkUserWriteAccess(user, target, critical);
            case "event":
                return self.checkEventWriteAccess(user, target, critical);
            default:
                return new Promise(function(resolve, reject) {
                    reject("Failed to authorize write access on target: unknown target type.");
                })
        }
    }

    /**
     *
     * @param user {User} requesting user
     * @param target {ObjectId | User} target user
     * @param role {UserGroup} new target role
     * @returns {Promise<unknown>}
     */
    checkUserRoleWriteAccess(user, target, role) {
        let self = this;
        //validate
        if (user === undefined || target === undefined || role === undefined) throw new Error("AuthService fail: invalid parameters given");
        let targetId = target;
        if (target.id !== undefined) targetId = target.id;

        return new Promise(function(resolve, reject){
            if(target === "self" || user.id.toString() === targetId.toString()) {
                //trying to write self
                aclService.getUserACL(user.id, true)
                    .then(userACL => {
                        //role write access is required
                        let writeRoles = self.checkAllowedGroupOperation(user, operations.access.WRITEUSERROLE);
                        let grantSelfIncrease;
                        //can't increase own level unless systemadmin operations are allowed
                        if (rolesMap[userACL.userRole] < rolesMap[role]){
                            //trying to increase level
                            grantSelfIncrease = self.checkAllowedGroupOperation(user, operations.access.GRANTUSERADMINRIGHTS);
                        }
                        else {
                            grantSelfIncrease = new Promise(function(resolveInner, rejectInner){
                                resolveInner(true);
                            })
                        }


                        Promise.all([writeRoles, grantSelfIncrease])
                            .then(result => {
                                resolve(result)
                            })
                            .catch(err => {
                                let fe = self.createForbiddenError("Insufficient access rights")
                                reject(fe)
                            })
                    })
                    .catch(err => reject(err))

            }
            else {
                let userACL = aclService.getUserACL(user.id, true);
                let targetACL = aclService.getUserACL(targetId, true);
                Promise.all([userACL, targetACL])
                    .then(results => {
                        userACL = results[0];
                        targetACL = results[1];
                        //role write access is required
                        self.checkAllowedGroupOperation(user, operations.access.WRITEUSERROLE)
                                .then(result => {
                                    //can't increase above own level
                                    if (rolesMap[userACL.userRole] < rolesMap[role]){
                                        let err = self.createForbiddenError("Cant increase target role to a higher access level than yourself.")
                                        reject(err)
                                    }
                                    else resolve(result);
                                })
                                .catch(err =>{
                                    reject(err)
                                })
                    })
            }
        })
    }

    /**
     * authorizes basic write access on event documents.
     *
     * @param user {UserScheme} requesting user
     * @param target {EventScheme} target event
     * @param critical {Boolean} forwards to critical security check
     * @returns {Promise<unknown>}
     */
    checkEventWriteAccess (user, target, critical) {
        let self = this;
        //validate
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");
        // if (critical) return self.checkEventWriteAccessCritical(user, target);

        return new Promise(function(resolve, reject){
            //general user write access is required
            self.checkAllowedGroupOperation(user, operations.events.WRITE)
                .then(group => {
                    resolve(group)
                })
                .catch(err => {
                    //try individual rights
                    self.checkIndividualAccess(user, target, operations.events.WRITE)
                        .then(result => {
                            resolve(result);
                        })
                        .catch(err => {
                            reject(err)
                        })
                })
        })
    }

    /**
     * authorizes basic write access on user documents. dont use this for critical properties, e.g. passwords or username
     *
     * @param user {UserScheme} requesting user
     * @param target {ObjectId} event id
     * @param operation {String} String representation of requested operation. Use static enum AuthService.operations to obtain string.
     * @returns {Promise<unknown>}
     */
    checkIndividualAccess (user, target, operation) {
        let self = this;
        //validate
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");
        let targetId;
        if (!Mongoose.isObjectIdOrHexString(target)) {
            //try if object was given
            if (Mongoose.isObjectIdOrHexString(target.id)) {
                targetId = target.id;
            }
        }
        else {
            targetId = target;
        }
        return new Promise(function(resolve, reject){
            aclService.getUserACL(user)
                .then(userACL => {
                    //try to find target in individuals
                    let targetRights = userACL.individual.events.find(object => {
                        return object.target.toString() === targetId.toString()
                    })
                    if (targetRights === undefined){
                        //no entry for target
                        let err = self.createForbiddenError();
                        reject(err)
                    }
                    else {
                        //check operation
                        let match = targetRights.allowedOperations.includes(operation);
                        if (match) {
                            resolve({status: 200, message: "Access granted."})
                        }
                        else {
                            let err = self.createForbiddenError();
                            reject(err)
                        }
                    }
                })
                .catch(err => {

                })
        })
    }



    /**
     * check user role against a required role
     *
     * @param user {UserScheme}
     * @param requiredRole {String}
     * @returns {Boolean}
     */
    checkRequiredRole(user, requiredRole){
        let id = typeof(user)=== "string" ? user: user.id;
        aclService.getUserACL(id)
            .then(userACL => {
                //superadmin is allowed to perform any operation
                if(userACL.userRole === rolesEnum.SUPERADMIN) return true;
                //get user access level
                let al = rolesMap[userACL.userRole];
                //compare. must be greater to allow operation
                return (al >= rolesMap[requiredRole]);
            })
            .catch(err => {
                throw new Error(err);
            });
    }

    /**
     * helper function to check if a given string refers to a valid operation
     * @param operation {String} string representation of an operation.
     * @returns {Boolean} true if valid
     */
    checkIfValidOperation(operation){
        if (operation === undefined || operation === null) return false;
        for (const [key, value] of Object.entries(operations)) {
            if (Object.values(value).includes(operation)) return true;
        }
        return false;
    }


    /**
     *
     * verifies that the db contains the default roles
     *
     * @param {Boolean} repair
     * @returns {Promise<unknown>}
     */
    verifyDefaultRoles(repair){
        let self = this;
        //run this on initialization of service
        //checks if the default groups are correctly contained in the database, and repairs them if not
        return new Promise(function(resolveMain, rejectMain){
            let promiseArray = [];
            self.groups.forEach(group => {
                //create nested promise
                promiseArray.push(new Promise(function(resolve, reject){
                    //check each group
                    UserGroup.find({title: group.title})
                        .then(dbGroup => {
                            //check if more than one group was returned
                            if (Array.isArray(dbGroup)){
                                if (dbGroup.length > 1) {
                                    let msg = "Failed to verify default group: " + group.title + "/ Reason: Group title is not unique. Please fix manually."
                                    // console.error(msg);
                                    reject(msg);
                                }
                                else {
                                    dbGroup = dbGroup[0];
                                }
                            }
                            if(verifyData(dbGroup, group)) {
                                //group verified successfully
                                group.dbRef = dbGroup.id;
                                resolve();
                            }
                            else {
                                let msg = "Failed to verify integrity of default group:" + group.title;
                                //verification failed.
                                //if repair parameter is set, try to repair. else fail
                                if (repair){
                                    console.warn(msg);
                                    console.log("Trying to repair default group...");
                                    //move current entry to new Group
                                    let bakGroup = {};
                                    Object.assign(bakGroup, dbGroup);
                                    delete bakGroup.id;
                                    bakGroup.title = "BACKUP: " + dbGroup.title;
                                    bakGroup.type = "system";
                                    bakGroup.default = false;
                                    let bak = new UserGroup(bakGroup);
                                    bak.save()
                                        .then()
                                        .catch()
                                    dbGroup.default = group.default;
                                    dbGroup.type = group.type;
                                    dbGroup.allowedOperations = group.allowedOperations;
                                    dbGroup.markModified('allowedOperations');
                                    dbGroup.save()
                                        .then(result => {
                                            let msg = "Default group restored."
                                            console.log(msg);
                                            resolve(dbGroup);
                                        })
                                        .catch(err => {
                                            let msg = "Unable to repair default group. Aborting. Reason: " + err;
                                            // console.error(msg)
                                            reject(msg);
                                        })

                                }
                                else {
                                    let err = msg
                                    reject(err);
                                }
                            }

                        })
                        .catch(err => {
                            console.warn("Unable to find default group in Database.")
                            if(repair) {
                                console.log("Trying to repair default group...");
                                let dbGroup = new UserGroup(group)
                                dbGroup.save()
                                    .then(result => {
                                        let msg = "Default group added to database."
                                        console.log(msg);
                                        resolve(msg);
                                    })
                                    .catch(err => {
                                        let msg = "Unable to add default group to database. Aborting. Reason: " + err;
                                        // console.error(msg)
                                        reject(msg);
                                    })

                            }
                        })
                })
                    // .then(result=> {
                    //     console.log(result);
                    // })
                    .catch(err => {
                        console.error(err);
                        rejectMain(err);
                    })
                )

            })
            //all default groups verified
            Promise.all(promiseArray)
                .then(resultArray => {
                    resolveMain(resultArray)
                })
                .catch(err => {
                  reject(err);
                })
        })
        function verifyData(dbGroup, group) {
            let verified = true;
            //check title
            if (dbGroup.title !== group.title) verified = false;
            //don't check description, this is allowed to be changed by sysadmin

            //check type
            if (dbGroup.type !== group.type) verified = false;

            //check default flag
            if (dbGroup.default !== group.default) verified = false;
            //check operations
            if (JSON.stringify(group.allowedOperations) !== JSON.stringify(dbGroup.allowedOperations)){
                verified = false;
            }
            return verified;
        }

    }

    /**
     * resolves the required operation for group modifications.
     * @param type {String} string identifier, equals to group type (["user","useradmin","eventadmin","system"])
     * @param action {groupActionsEnum} Grant or revoke
     * @returns {string} Operation
     */
    getRequiredGroupOperation (type, action) {
        if (type === undefined || action === undefined) {
            throw new Error("Authenrication Serive fail: Invalid parameters given")
        }
        switch (type) {
            case "user":
                return (action ===  groupActionsEnum.GRANT) ? operations.access.GRANTUSERGROUPS : operations.access.REVOKEUSERGROUPS;

            case "useradmin":
                return (action ===  groupActionsEnum.GRANT) ? operations.access.GRANTUSERADMINRIGHTS : operations.access.REVOKEUSERADMINRIGHTS;

            case "eventadmin":
                return (action ===  groupActionsEnum.GRANT) ? operations.access.GRANTEVENTADMINRIGHTS : operations.access.REVOKEEVENTADMINRIGHTS;

            case "system":
                return (action ===  groupActionsEnum.GRANT) ? operations.access.GRANTSYSTEMADMINRIGHTS : operations.access.REVOKESYSTEMADMINRIGHTS;

            default:
                return (action ===  groupActionsEnum.GRANT) ? operations.access.GRANTUSERGROUPS : operations.access.REVOKEUSERGROUPS;
        }

    }

    createForbiddenError (optMessage) {
        if (optMessage !== undefined && typeof(optMessage) === "string") {
            console.log("403: " + optMessage);
        }
        return {name : "ForbiddenError", status: 403, message : "Access denied"};
    }




}



let authService = new AuthService()
authService.roles = roles;
authService.operations = operations;
authService.rolesEnum = rolesEnum;
authService.rolesMap = rolesMap;
export default authService;

