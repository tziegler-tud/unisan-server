import bcrypt from 'bcrypt';
import db from '../schemes/mongo.js';
import LogService from "./logService.js";
import Log from '../utils/log.js';
import AuthEnums from "./authEnums.js";
import userService from "./userService.js";

const UserGroup = db.UserGroup;
const UserACL = db.UserACL;
const User = db.User;

/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */


export default {
    getAll,
    getAllFiltered,
    getManyByUserId,
    createUserACL,
    getUserACL,
    getCurrentDocker,
    getUserGroups,
    getUserRole,
    setUserRole,
    addUserGroup,
    removeUserGroup,
    remove,
    update,
    rebuildFromUserData,
    rebuildFresh,
    updateAllUser,
};



async function getAll (req) {
    return UserACL.find();
}


/**
 *
 * @param args {Object}
 * @param args.sort {String} property to sort
 * @param args.filter {Object} filter object
 * @param args.filter.filter {String} field name to filter
 * @param args.filter.value {String} value to filter. Accepts mongo syntax
 * @returns {Promise<[User]>}
 */
async function getAllFiltered(args){
    let defaults = {
    }
    args = (args === undefined) ? {}: args;
    args = Object.assign(defaults, args);

    let filter = args.filter;
    let sort= args.sort;
    let query;
    if (filter===undefined || filter.filter === undefined || filter.value === undefined) {
        query = UserACL.find();
    }
    else {
        let filterObj = {};
        filterObj[filter.filter] = filter.value;
        query = UserACL.find(filterObj);
    }

    if(sort === undefined) {
        return query;
    }
    else {
        return query.sort(sort);
    }
}

/**
 * Returns all acl documents corresponding to the given array of user ids.
 */
async function getManyByUserId(idArray) {
    return UserACL.find({
        'user': {
            $in: idArray
        }
    })
}

async function getUserGroups(userid, {populate=true, json=false}) {
    const userAcl = await getUserACL(userid,{populate: {userGroups: populate}});
    let groups = (json) ? userAcl.toJSON().userGroups : userAcl.userGroups;
    return groups;
}

async function getUserACL(userid, {populate={userGroups: true, events: false}}={}) {
    if (typeof(userid) !== "string") {
        //try if user object
        if(typeof(userid.id) === "string") userid = userid.id;
        else throw new Error("invalid parameter given");
    }
    let user = await User.findById(userid).select('-hash');
    let q = UserACL.findOne({user: userid});
    if (populate.userGroups) {
        q.populate("userGroups");
    }
    if (populate.events) {
        q.populate("individual.events.target")
    }
    let userACL = await q.exec()


    // validate
    if (!user) throw new Error('User not found');
    if (!userACL) throw new Error('User AccessControlList not found');
    //check write access
    // if(!AuthService.checkUserRightsReadAccess(req.user, user)) {
        //reject({status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."})
        // throw {status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."};
    // }
    return userACL;
}

async function getCurrentDocker(userid) {
    return new Promise(function(resolve, reject){
        UserACL.findOne({user: userid})
            .then(userACL => {
                resolve(userACL.docker);
            })
            .catch(err => {
                reject(err);
            })
    })
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
        aclObj.docker = {}
        const userACL = new UserACL(aclObj);
        return aclObj.save();
    }

}


async function getUserRole (userid) {
    let user = await User.findById(userid).select('-hash');
    let userACL = await UserACL.findOne({user: userid});

    // validate
    if (!user) throw new Error('User not found');
    if (!userACL) throw new Error('User AccessControlList not found');

    return userACL.userRole;
    //check write access
    // AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.access.READUSERROLE)
    //     .then(result=>{
    //         return userACL.userRole;
    //     })
    //     .catch(err => {
    //         throw {status: 403, message: "Fehler: Sie haben keine Berechtigung, die Rechte dieses Nutzers einzusehen."};
    //     })
}


async function setUserRole (req, userid, role) {
    let user = await User.findById(userid).select('-hash');
    let userACL = await UserACL.findOne({user: userid});

    // validate
    if (!user) throw new Error('User not found');
    if (!userACL) throw new Error('AccessControlList not found');
    //check write access

    let validRoles = AuthEnums.roles;
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
    if (AuthEnums.rolesMap[role] > AuthEnums.rolesMap[req.user.userRole]){
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


async function addUserGroup(req, userid, userGroupId){
    //implement by userService
    return userService.addUserGroup(req,userid,userGroupId)
}

async function removeUserGroup(req, id, userGroupId){
    //implemented by userService
    return userService.removeUserGroup(req, id, userGroupId);
}

async function remove(req, id) {
    return UserACL.findByIdAndDelete(id);
}

async function update(req, id, data) {

    const user = await User.findById(id);
    const userACL = await UserACL.findOne({user:id});

    // validate
    if (!user) throw new Error('ACL modification error: assigned user not found.');
    if (!userACL) throw new Error('ACL modification error: no acl object found.');

    // copy data to object
    Object.assign(userACL, data);

    return userACL.save()
        .then( userACL => {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "acl",
                    actionType: "modify",
                    actionDetail: "aclModify",
                    key: "",
                    fullKey: "",
                    originalValue: "",
                    value:  "",
                    tag: "<OVERWRITE>"
                },
                authorizedUser: req.user,
                target: {
                    targetType: "ACL",
                    targetObject: userACL._id,
                    targetObjectId: userACL._id,
                    targetModel: "ACL",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
            LogService.create(log).then().catch();
    })
        .catch(err => {
            throw new Error('ACL modification error: Error writing acl to database. Details: ' + err);
        })
}

async function rebuildFromUserData(req){
    //helper function to transform existing data to new scheme for one-time use.
    //do not expose this function in production

    //get all user
    // let userArray = await userService.getAll();
    let userArray = await User.find().populate({
        path: 'userGroups',
        select: 'title description',
    });
    userArray.forEach(user => {
        let id = user.id;
        //find user role
        let role = user.userRole;
        //groups
        let groups = [];
        user.userGroups.forEach(group => {
            groups.push(group.id)
        });

        let oj = {
            user: id,
            userRole: role,
            userGroups: [],
            individual: {
                events: []
            }
        };
        //build acl
        let userACL = new UserACL(oj);
        userACL.save();
    })
}

async function updateAllUser(req){
    let userAclArray = await UserACL.find();
    let promises = [];
    userAclArray.forEach(user => {
        promises.push(user.save());
    })
    return await new Promise(function(resolve, reject){
        Promise.all(promises)
            .then(result => {
                resolve({successful: true})
            })
            .catch(err => {
                reject(err);
            })
    })
}

async function rebuildFresh(req){
    //helper function to transform existing data to new scheme for one-time use.
    //do not expose this function in production

    //get all user
    // let userArray = await userService.getAll();
    let userArray = await User.find();
    userArray.forEach(user => {
        let id = user.id;
        //groups
        let groups = [];

        let oj = {
            user: id,
            userRole: "member",
            userGroups: [],
            individual: {
                events: []
            }
        };
        //try to find existing acl
        UserACL.findOne({user: id})
            .then(user => {
                if (user) {
                    //just ignore existing for now

                    //delete and rebuild
                    // UserACL.deleteOne({user: id})
                    //     .then(result => {
                    //         let userACL = new UserACL(oj);
                    //         userACL.save();
                    //     })
                }
                else {
                    //build acl
                    let userACL = new UserACL(oj);
                    return userACL.save();
                }
            })
            .catch(err => {
                let userACL = new UserACL(oj);
                return userACL.save();
            })
    })
}
