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

        //populate userGroups
        await user.populate({
            path: 'userGroups',
        }).execPopulate();
        let userGroups = user.userGroups;
        //check if url and method are part of userGroups
        let authorizedGroup = userGroups.find(function(group){
            return group.allowedOperations.some(function(op){
                //transform url to regex to respect wildcard symbols
                let regUrl = new RegExp('^' + op.url.replace(/\/?\*/g, '.*') + '$');
                return (op.method === method && regUrl.test(url));
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

    checkIfEdit(user, target){
        //check if user is userAdmin
        let group = this.checkUserGroupName(user, "userAdmin");
        //check write access
        let write = this.checkWriteAccess(user, target);
        return (group && write);
    }
    /**
     * check user role agains a required role
     *
     * @param user {UserScheme}
     * @param requiredRole {role}
     * @returns {Boolean}
     */
    checkRequiredRole(user, requiredRole){
        //get user access level
        let al = rolesEnum[user.role];
        //compare. must be greater to allow operation
        return (al > rolesEnum[requiredRole]);
    }

    /**
     * checks if user has higher role than target. use this for user modifications
     *
     * @param user {UserScheme}
     * @param target {UserScheme}
     * @returns {Boolean}
     */
    checkWriteAccess(user, target){
        //superadmin is allowed to perform any operation
        if(user.userRole === rolesEnum.SUPERADMIN) return true;
        //operations on protected user are not allowed
        if (target.userRole === rolesEnum.PROTECTED) return false;
        //get user access level
        let al = rolesMap[user.userRole];
        //compare. must be greater to allow operation
        return (al > rolesMap[target.userRole]);
    }

}

AuthService.roles = roles;
AuthService.rolesEnum = rolesEnum;
AuthService.rolesMap = rolesMap;
module.exports = AuthService;

