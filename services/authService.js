import Mongoose from "mongoose";
import db from '../schemes/mongo.js';
import aclService from "./aclService.js";
import authEnums from '../services/authEnums.js';

const UserGroup = db.UserGroup;
const UserACL = db.UserACL;
const User = db.User;

/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
/** @typedef {import("../services/userService.js").User} User */
/** @import { UserObject } from  './services/userService.js' */
/** @import { EventObject } from  './services/eventService.js' */


    const rolesMap = authEnums.rolesMap;
    const rolesEnum = authEnums.rolesEnum;
    const groupsEnum = authEnums.groupsEnum;
    const groupActionsEnum = authEnums.groupActionsEnum;
    const roles = authEnums.roles;
    const operations = authEnums.operations;

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
        operations.news.READ,
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

        operations.system.USER,
        operations.system.QUALIFICATIONS,
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

        operations.system.EVENTS,
    ]
}

let defaultNewsAdmin = {
    title: "newsAdmin",
    description: "News erstellen, bearbeiten und löschen",
    default: true,
    type: "newsadmin",
    allowedOperations: [
        operations.news.READ,
        operations.news.CREATE,
        operations.news.WRITE,
        operations.news.DELETE,

        operations.system.NEWS,
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

        operations.system.GOUPS,
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
        operations.user.WRITECRITICAL,

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

        operations.system.EVENTS,
        operations.system.USER,
        operations.system.LOGS,
        operations.system.GOUPS,
        operations.system.SYSTEM,
        operations.system.QUALIFICATIONS,
        operations.system.MAIL,
        operations.system.AUTH,
        operations.system.DEVELOPMENT,
    ]
}


let defaultGroups = [
    defaultMember,
    defaultUserAdmin,
    defaultEventAdmin,
    defaultNewsAdmin,
    defaultAclAdmin,
    defaultSysAdmin,
]

class AuthService {
    constructor() {
        console.log("initializing authentication service...\n");
        let self = this;
        this.groups = defaultGroups;
        this.roles = roles;
        this.rolesMap = rolesMap;
        this.rolesEnum = rolesEnum;
        this.groupsEnum = groupsEnum;
        this.groupActionsEnum = groupActionsEnum;
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
     * @param requestingUser {UserObject} requesting user
     * @param operation {String} String representation of requested operation. Use static enum AuthService.operations to obtain string.
     * @returns {Promise<{status, message}>}
     * @throws ApiForbiddenError Throws ForbiddenError if access is not granted
     * @throws Error if service is not ready
     */
    async checkAllowedGroupOperation(requestingUser, operation) {

        if (requestingUser === undefined || operation === undefined) throw new Error("AuthService fail: invalid parameters given");
        try {
            await this.init;
        }
        catch(e) {
            let msg = "Failed to perform operation: Authentication Service has not been initialized";
            throw new Error(msg)
        }

        let id = requestingUser.id;
        const userACL = await aclService.getUserACL(id, {populate: {userGroups: true, events: false}})
        //check if superadmin
        if (userACL.userRole === this.rolesEnum.SUPERADMIN) {
            console.log("authorized by role: " + userACL.userRole); //debug TODO: remove once done testing
            return {status: 200, message: "authorization successful"};
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
            return {status: 200, message: "authorization successful"}
        }
        else {
            //no access rights
            throw this.createForbiddenError("authorization failed for operation "+ operation)
        }

    }

    /**
     *
     * @param user {UserObject}
     * @param target {UserObject}
     * @returns {Promise<UserRoleObject>}
     * @throws ApiForbiddenError Throws ForbiddenError if access is not granted
     */
    async checkRoleAccess (user, target){
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");
        //get user role
        let userRole = await aclService.getUserRole(user.id.toString());
        let targetRole = await aclService.getUserRole(target.id.toString());

        //superadmin is allowed to perform any operation
        if(userRole === rolesEnum.SUPERADMIN) return userRole;
        //operations on protected user are only allowed by superadmin
        if (targetRole === rolesEnum.PROTECTED) throw this.createForbiddenError("Access denied. Reason: target role: " + rolesEnum.PROTECTED);
        //get user access level
        let al = this.rolesMap[userRole];
        //compare. must be greater or equal to allow operation
        let write = (al >= this.rolesMap[targetRole]);
        if  (write) {
            return userRole;
        }
        else {
            throw this.createForbiddenError("Insufficient access rights.")
        }
    }

    /**
     * authorizes basic write access on user documents. Don't use this for critical properties, e.g. passwords or username
     *
     * @param user {UserObject} requesting user
     * @param target {UserObject} target user
     * @param critical {Boolean} DEPRECATED: forwards to critical security check
     * @returns {Promise<{status, message}>}
     */
    async checkUserWriteAccess (user, target, critical=false) {
        let self = this;
        //validate
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");

        //TODO: Remove deprecated property call
        if (critical !== undefined) {
            console.warn("WARNING: Using Deprecated call 'checkUserWriteAccess' using deprecated property 'critical'");
            if (critical) return self.checkUserWriteAccessCritical(user, target);
        }

        if(user.id.toString() === target.id.toString()) {
            //trying to write self
            return await self.checkAllowedGroupOperation(user, operations.user.WRITESELF)
        }
        else {
            return await self.checkAllowedGroupOperation(user, operations.user.WRITE)
        }
    }

    /**
     * authorizes critical write access on user documents. Use this for critical user properties, e.g. passwords or username.
     * Never use this for access-related writing, or else users can escalate their own access rights
     *
     *
     * @param user {UserObject} requesting user
     * @param target {UserObject} target user
     * @returns {Promise<{status, message}>}
     */
    async checkUserWriteAccessCritical (user, target) {
        //validate
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");

        if(user.id === undefined || target.id === undefined) {
            throw new Error("AuthService fail: invalid parameters given");
        }


        if(user.id.toString() === target.id.toString()) {
            //trying to write self
            return await this.checkAllowedGroupOperation(user, operations.user.WRITESELF)
        }
        else {
            try {
                //general user write access is required
                let writeAccess = await this.checkAllowedGroupOperation(user, operations.user.WRITECRITICAL)
                let accessLevel = await this.checkRoleAccess(user, target);
                console.log("critical user write access granted by group: " + group.title + "and access level: " + accessLevel);
                return {status: 200, message: "Access granted"};
            }
            catch(err) {
                throw new Error("Insufficient permissions.")
            }
        }
    }

    /**
     * authorizes delete access on user documents.
     *
     * @param user {UserObject} requesting user
     * @param target {UserObject} target user
     * @returns {Promise<unknown>}
     */
    async checkUserDeleteAccess (user, target) {
        //validate
        if (user === undefined || target === undefined) throw new Error("AuthService fail: invalid parameters given");
        if (user.id === undefined) {
            throw new Error("AuthService fail: Invalid user object given.")
        }
        const group = await this.checkAllowedGroupOperation(user, operations.user.DELETE);
        //general user delete access is required
        let accessLevel = await this.checkRoleAccess(user, target);
        console.log("critical user write access granted by group: " + group.title + "and access level: " + accessLevel);
        return user;

    }

    /**
     *
     * @param user {UserObject} requesting user
     * @param target {UserObject} target user
     * @param group {UserGroup} group to be added or revoked
     * @param grant {Boolean} grant = true, revoke = false
     * @returns {Promise<unknown>}
     */
    async checkUserGroupWriteAccess(user, target, group, grant) {
            //validate
            if (user === undefined || target === undefined || group === undefined || group.type === undefined) throw new Error("AuthService fail: invalid parameters given");

            let granting = (grant === undefined || grant) ? groupActionsEnum.GRANT : groupActionsEnum.REVOKE;
            let groupOperation = this.getRequiredGroupOperation(group.type, granting);

            let addGroupPermission = await this.checkAllowedGroupOperation(user, groupOperation)

        if(user.id.toString() === target.id.toString()) {
            //trying to write self
            try {
                let writeSelf = await this.checkAllowedGroupOperation(user, operations.user.WRITESELF);
                return writeSelf && addGroupPermission
            }
            catch (e) {
                throw new Error("Inappropriate access rights to modify own permissions. Error: " + e);
            }
        }
        else {
            //general user write access is required
            try {
                let writeAccess = await this.checkAllowedGroupOperation(user, operations.user.WRITE)
                return writeAccess && addGroupPermission
            }
            catch (e){
                throw new Error("Inappropriate access rights to modify user groups. Error: " + e);
            }
        }
    }

    async checkCreateUserWithGroupWriteAccess(user, group, grant) {
        //validate
        if (user === undefined || group === undefined || group.type === undefined) throw new Error("AuthService fail: invalid parameters given");

        let granting = (grant === undefined || grant) ? groupActionsEnum.GRANT : groupActionsEnum.REVOKE;
        let groupOperation = this.getRequiredGroupOperation(group.type, granting);

        //trying to create new user with groups
        try {
            let writeSelf = await this.checkAllowedGroupOperation(user, operations.user.CREATE);
            let addGroup = await this.checkAllowedGroupOperation(user, groupOperation)
            return writeSelf && addGroup
        }
        catch (e) {
            throw new Error("Inappropriate access rights to create user with permissions. Error: " + e);
        }
    }


        /**
     * authorizes basic write access on target document. dont use this for critical properties, e.g. passwords or username
     *
     * @param user {UserObject} requesting user
     * @param target {UserObject | EventObject} target user
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
     * @param user {UserObject} requesting user
     * @param target {UserObject} target user
     * @param role {UserGroup} new target role
     * @returns {Promise<unknown>}
     */
    async checkUserRoleWriteAccess(user, target, role) {
        //validate
        if (user === undefined || target === undefined || role === undefined) throw new Error("AuthService fail: invalid parameters given");
        const userACL = await aclService.getUserACL(user.id, {populate: {userGroups: true, events: false}});

        await this.checkAllowedGroupOperation(user, operations.access.WRITEUSERROLE)

        if(user.id.toString() === target.id.toString()) {
            //trying to write self
            //role write access is required
            //can't increase own level unless systemadmin operations are allowed
            if (this.rolesMap[userACL.userRole] < this.rolesMap[role]){
                //trying to increase level
                await this.checkAllowedGroupOperation(user, operations.access.GRANTUSERADMINRIGHTS);
            }
            return true;
        }
        else {
            //role write access is required
            //can't increase above own level
            if (this.rolesMap[userACL.userRole] < this.rolesMap[role]){
                throw this.createForbiddenError("Cant increase target role to a higher access level than yourself.")
            }
            else return true;
        }
    }

    /**
     * authorizes basic write access on event documents.
     *
     * @param user {UserObject} requesting user
     * @param event {EventObject} target event
     * @returns {Promise<unknown>}
     */
    async checkEventWriteAccess (user, event) {
        //validate
        if (user === undefined || event === undefined) throw new Error("AuthService fail: invalid parameters given");

        //general user write access is required
        try {
            const group = await this.checkAllowedGroupOperation(user, operations.events.WRITE)
            return group;
        }
        catch(e){
            return this.checkIndividualEventAccess(user, event, operations.events.WRITE)
        }
    }

    /**
     *
     * @param user {UserObject} requesting user
     * @param event {EventObject} event id
     * @param operation {String} String representation of requested operation. Use static enum AuthService.operations to obtain string.
     * @returns {Promise<{status, message}>}
     */
    async checkIndividualEventAccess (user, event, operation) {
        //validate
        if (user === undefined || event === undefined) throw new Error("AuthService fail: invalid parameters given");

        const userACL = await aclService.getUserACL(user)

        //try to find target in individuals
        let targetRights = userACL.individual.events.find(object => {
            return object.target.toString() === event.id.toString()
        })
        if (targetRights === undefined){
            //no entry for target
            throw this.createForbiddenError("Event not modifiable by user.");
        }
        else {
            //check operation
            let match = targetRights.allowedOperations.includes(operation);
            if (match) {
                return {status: 200, message: "Access granted."};
            }
            else {
                throw this.createForbiddenError();
            }
        }
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
                                    bakGroup.title = "BACKUP: " + dbGroup.title + "-" + Date.now();
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
            throw new Error("Authentication Service failed: Invalid parameters given")
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
        return ApiForbiddenError(optMessage)
    }




}



let authService = new AuthService()
export default authService;

