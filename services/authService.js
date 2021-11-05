const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');

const UserGroup = db.UserGroup;
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

class AuthService {
    constructor() {
        console.log("initializing authentication service...\n");
        //might wanna do smt here later
        console.log("authentication service initialized succesfully.");
    }

    /**
     *
     * @param user {UserScheme} user object
     * @param method {String} <["GET","POST","PUT","DELETE"]>
     * @param url {String}
     * @returns {Promise<boolean>} true if permission granted
     */
    async checkUrlPermission(user, method, url){

        //superadmin must not pass url permission test
        if(user.userRole === rolesEnum.SUPERADMIN) return true;
        //populate userGroups
        await user.populate({
            path: 'userGroups',
        });
        let userGroups = user.userGroups;
        //check if url and method are part of userGroups
        let authorizedGroup = userGroups.find(function(group){
            return group.allowedOperations.some(function(op){
                let allowedUrl = op.url;
                //replace $currentUserName, $currentUserId by respective values
                allowedUrl = allowedUrl.replace("$currentUserName", user.username);
                allowedUrl = allowedUrl.replace("$currentUserId", user.id);
                //transform url to regex to respect wildcard symbols
                let regUrl = new RegExp('^' + allowedUrl.replace(/\/?\*/g, '.*') + '$');

                //remove url parameters
                let strippedUrl = url.replace(/\?.*/g, "");

                return (op.method === method && regUrl.test(strippedUrl));
            })
        })
        if(authorizedGroup) {
            console.log("authorized for operation: "+method + ":" + url + " by group membership: " + authorizedGroup.title);
            return true;
        }
        else {
            return false;
        }
    }


    //check if user has group
    checkUserGroupName(user,groupname) {
        let userGroups = user.userGroups;
        return userGroups.some(group => group.title === groupname);
    }

    checkIfEdit(user, target, targetType){
        let result = false;
        //target can be user or event atm
        switch(targetType){
            case "user": {
                result = this.checkUserWriteAccess(user, target)
                break;
            }
            case "event": {
                result = this.checkEventWriteAccess(user, target);
                break;
            }
            default: {
                console.warn("AuthService.checkIfEdit: invalid target type given.")
                result = false;
                break;
            }
        }
        return result;

    }

    checkIfCreate(user, target, targetType){
        let result = false;
        //target can be user or event atm
        switch(targetType){
            case "user": {
                result = this.checkUserCreateAccess(user, target)
                break;
            }
            case "event": {
                result = this.checkEventCreateAccess(user, target);
                break;
            }
            default: {
                console.warn("AuthService.checkIfEdit: invalid target type given.")
                result = false;
                break;
            }
        }
        return result;

    }


    /**
     * check user role against a required role
     *
     * @param user {UserScheme}
     * @param requiredRole {String}
     * @returns {Boolean}
     */
    checkRequiredRole(user, requiredRole){
        //superadmin is allowed to perform any operation
        if(user.userRole === rolesEnum.SUPERADMIN) return true;
        //get user access level
        let al = rolesMap[user.userRole];
        //compare. must be greater to allow operation
        return (al >= rolesMap[requiredRole]);
    }

    /**
     * checks if allowed to create new user.
     *
     * @param user {UserScheme}
     * @returns {Boolean}
     */
    checkUserCreateAccess(user){
        //superadmin is allowed to perform any operation
        if(user.userRole === rolesEnum.SUPERADMIN) return true;
        //check if user is userAdmin
        let group = this.checkUserGroupName(user, "userAdmin");
        //check write access
        return group;
    }

    /**
     * checks if user has write access on target user. use this for user modifications
     *
     * @param user {UserScheme}
     * @param target {UserScheme}
     * @returns {Boolean}
     */
    checkUserWriteAccess(user, target){
        //superadmin is allowed to perform any operation
        if(user.userRole === rolesEnum.SUPERADMIN) return true;
        //operations on protected user are not allowed
        if (target.userRole === rolesEnum.PROTECTED) return false;
        //get user access level
        let al = rolesMap[user.userRole];
        //compare. must be greater or equal to allow operation
        let write = (al >= rolesMap[target.userRole]);

        //check if user is userAdmin
        let group = this.checkUserGroupName(user, "userAdmin");
        //check write access
        return (group && write);
    }

    /**
     * checks if allowed to create new events.
     *
     * @param user {UserScheme}
     * @returns {Boolean}
     */
    checkEventCreateAccess(user){
        //superadmin is allowed to perform any operation
        if(user.userRole === rolesEnum.SUPERADMIN) return true;
        //check if user is userAdmin
        let group = this.checkUserGroupName(user, "eventAdmin");
        //check write access
        return group;
    }

    /**
     * checks if user has write access on target event. use this for event modifications
     *
     * @param user {UserScheme}
     * @param target {EventScheme}
     * @returns {Boolean}
     */
    checkEventWriteAccess(user, target){
        //validate
        //TODO: proper validation

        //superadmin is allowed to perform any operation
        // if(user.userRole === rolesEnum.SUPERADMIN) return true;
        //user needs general role eventAdmin or specific eventAdmin role
        //check group
        if (this.checkUserGroupName(user,"eventAdmin")) return true;
        //check admin array for user id
        if (target.accessRights !== undefined)  {
            if (target.accessRights.admin !== undefined) {
                if (target.accessRights.admin.includes(user.id)){
                    //user found. access granted
                    return true;
                }
            }
        }
        return false;
    }
}

let authService = new AuthService()
authService.roles = roles;
authService.rolesEnum = rolesEnum;
authService.rolesMap = rolesMap;
module.exports = authService;

