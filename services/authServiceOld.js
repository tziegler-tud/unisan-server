const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');

const aclService = require("./aclService");

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

let groupsEnum = {
    MEMBER: "member",
    USERADMIN: "userAdmin",
    EVENTADMIN: "eventAdmin",
    ACLADMIN: "aclAdmin",
    SYSADMIN: "systemAdmin"
}

let roles = [
    "protected",
    "member",
    "admin",
    "superadmin",
]

let defaultMember = {
    title: "member",
    description: "Standardgruppe für Nutzer. Erlaubt grundlegenden Systemzugriff.",
    default: true,
    allowedOperations: [
        {
            method: "GET",
            url: "/api/v1/usermod/current"
        },
        {
            method: "GET",
            url: "/unisams/user/view/*"
        },
        {
            method: "POST",
            url: "/api/v1/usermod/filter"
        },
        {
            method: "GET",
            url: "/api/v1/usermod/*"
        }
    ],
}

let defaultUserAdmin = {
    title: "userAdmin",
    description: "Nutzer erstellen, bearbeiten und löschen",
    default: true,
    allowedOperations: [
        {
            method: "POST",
            url: "/api/v1/usermod/create"
        },
        {
            method: "DELETE",
            url: "/api/v1/usermod/*"
        },
        {
            method: "POST",
            url: "/api/v1/usermod/*"
        },
        {
            method: "PUT",
            url: "/api/v1/usermod/*"
        },
        {
            method: "GET",
            url: "/api/v1/usermod/*"
        },
        {
            method: "GET",
            url: "/unisams/user/*"
        }
    ]
}

let defaultEventAdmin = {
    title: "eventAdmin",
    description: "Events erstellen, bearbeiten und löschen",
    default: true,
    allowedOperations: [
        {

            method: "GET",
            url: "/api/v1/eventmod/*"
        },
        {

            method: "POST",
            url: "/api/v1/eventmod/*"
        },
        {

            method: "PUT",
            url: "/api/v1/eventmod/*"
        },
        {

            method: "DELETE",
            url: "/api/v1/eventmod/*"
        },
        {
            method: "GET",
            url: "/unisams/events/*"
        },
        {
            method: "POST",
            url: "/unisams/events/*"
        },
        {
            method: "GET",
            url: "/unisams/user/*",
        }
    ]
}

let defaultAclAdmin = {
    title: "aclAdmin",
    description: "Zugriffsrechte bearbeiten",
    default: true,
    allowedOperations: [
    ]
}

let defaultSysAdmin = {
    title: "systemAdmin",
    description: "Systemeinstellungen bearbeiten, Rechte vergeben",
    default: true,
    allowedOperations: [
        {

            method: "GET",
            url: "/api/v1/groups/*"
        },
        {

            method: "POST",
            url: "/api/v1/groups/*"
        },
        {

            method: "PUT",
            url: "/api/v1/groups/*"
        },
        {

            method: "DELETE",
            url: "/api/v1/groups/*"
        },
        {
            method: "GET",
            url: "/unisams/settings*"
        },
        {
            method: "POST",
            url: "/unisams/settings*"
        },
        {
            method: "POST",
            url: "/api/v1/usermod/*"
        },
        {
            method: "PUT",
            url: "/api/v1/usermod/*"
        },
        {
            method: "GET",
            url: "/api/v1/usermod/*"
        },
        {
            method: "GET",
            url: "/unisams/user/*",
        }
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
        let init = new Promise(function(resolve, reject){
            //might wanna do smt here later
            self.verifyDefaultRoles().
            then(function(result){
                if(result) resolve();
            })
                .catch(function(err){
                    reject(err)
                })
        });
        init.then(function(resolve){
            console.log("authentication service initialized succesfully.");
        })
    }

    /**
     *
     * @param user {UserScheme} user object
     * @param method {String} <["GET","POST","PUT","DELETE"]>
     * @param url {String}
     * @returns {Promise<boolean>} true if permission granted
     */
    async checkUrlPermission(user, method, url){
        let id = typeof(user) === "string" ? user: user.id;
        let userACL = await aclService.getUserACL(id);
        //superadmin must not pass url permission test
        if(userACL.userRole === rolesEnum.SUPERADMIN) return true;

        let userGroups = userACL.userGroups;
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
        let id = typeof(user)=== "string" ? user: user.id;
        aclService.getUserACL(id)
            .then(userACL => {
                let userGroups = userACL.userGroups;
                return userGroups.some(group => group.title === groupname);
            })
            .catch(err => {
                throw new Error(err);
            });

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
     * checks if allowed to create new user.
     *
     * @param user {UserScheme}
     * @returns {Boolean}
     */
    checkUserCreateAccess(user){
        let id = typeof(user)=== "string" ? user: user.id;
        aclService.getUserACL(id)
            .then(userACL => {
                //superadmin is allowed to perform any operation
                if(userACL.userRole === rolesEnum.SUPERADMIN) return true;
                //check if user is userAdmin
                let group = this.checkUserGroupName(user, "userAdmin");
                //check write access
                return group;
            })
            .catch(err => {
                throw new Error(err);
            });

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

    /**
     * checks if user has read access on target user acl. use this for authentication
     *
     * @param user {UserScheme}
     * @param target {UserScheme}
     * @returns {Boolean}
     */
    checkUserRightsReadAccess(user, target){
        //get requesting user acl
        aclService.getUserACL()
            .then(reqUserACL => {
                //superadmin is allowed to perform any operation
                if(reqUserACL.userRole === rolesEnum.SUPERADMIN) return true;
                //get user access level
                let al = rolesMap[reqUserACL.userRole];
                //check if user is userAdmin
                let group = this.checkUserGroupName(user, groupsEnum.ACLADMIN);
                //check write access
                return (group);
            })
            .catch(err => {
                throw new Error(err);
            })

    }

    /**
     * checks if user has write access on target user. use this for acl modifications
     *
     * @param user {UserScheme}
     * @param target {UserScheme}
     * @returns {Boolean}
     */
    checkUserRightsWriteAccess(user, target){
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

    async verifyDefaultRoles(){
        return true;

    }
}

let authService = new AuthService()
authService.roles = roles;
authService.rolesEnum = rolesEnum;
authService.rolesMap = rolesMap;
module.exports = authService;

