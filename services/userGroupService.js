const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');

const UserService = require("./userService");

const UserGroup = db.UserGroup;

/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */

module.exports = {
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
 * @param {UserGroup} groupObject
 */
async function create(req, groupObject, args) {
    // create qualification document
    const group = new UserGroup(groupObject);
    // save in database
    return group.save();
}


/**
 * Updates an existing group
 * @param {number} id groupId
 * @param {UserGroup} groupObject
 */
async function update(id, groupObject) {
    const group = await UserGroup.findById(id);
    // validate
    if (group == null) throw new Error('Group not found');
    // copy qualParam properties to qualification document
    Object.assign(group, groupObject);
    return group.save();
}

/**
 * Deletes a group
 * @param {Object} req request object
 * @param {number} id The id of the group to delete
 */
async function _delete(req, id) {
    return new Promise(function(resolve, reject){
        removeGroupFromAllUser(req, id)
            .then(function(result){
                UserGroup.findByIdAndRemove(id)
                    .then(function(result){
                        resolve(result);
                    })
            })
            .catch(function(err){
                reject(err)
            });
    })

}

/**
 * adds a permission to a group
 * @param {number} id group id
 * @param {String} method String denoting the html request method <["GET","POST","PUT","DELETE", "ALL"]>
 * @param {String} url  the url for which the rule applies
 */

async function addPermission(id, method, url) {
    const group = await UserGroup.findById(id);
    let methods = ["GET", "POST", "PUT", "DELETE", "ALL"];
    // validate
    if (group == null) throw new Error('Group not found');
    if(!methods.includes(method)) {
        console.log("invalid method. Aborting...");
        throw new Error('Invalid method');
    }
    if(typeof url === 'string') {
        var reg = new RegExp(/^[^\/]+\/[^\/].*$|^\/[^\/].*$/gmi);
        if (!reg.test(url)){
            throw new Error("invalid url");
        }
    }
    else {
        throw new Error("url not a string");
    }

    let permissionObject = {
        method: method,
        url: url,
    };
    group.allowedOperations.push(permissionObject);
    await group.save();
    return group;
}

/**
 * updates a permission
 * @param {number} id group id
 * @param {String} currentMethod String denoting the html request method to be updated
 * @param {String} currentUrl  the url to be updated
 * @param {String} newMethod String denoting the updated html request method <["GET","POST","PUT","DELETE", "ALL"]>
 * @param {String} newUrl  the updated url for which the rule applies
 */

async function updatePermission(id, currentMethod, currentUrl, newMethod, newUrl) {
    const group = await UserGroup.findById(id);
    let methods = ["GET", "POST", "PUT", "DELETE", "ALL"];
    // validate
    if (group == null) throw new Error('Group not found');
    if(!methods.includes(newMethod)) {
        console.log("invalid method. Aborting...");
        throw new Error('Invalid method');
    }
    if(typeof newUrl === 'string') {
        var reg = new RegExp(/^[^\/]+\/[^\/].*$|^\/[^\/].*$/gmi);
        if (!reg.test(url)){
            throw new Error("invalid url");
        }
    }
    else {
        throw new Error("url not a string");
    }

    let permissionObject = {
        method: newMethod,
        url: newUrl,
    };

    //find object in array
    let index = group.allowedOperations.findIndex(function(v){
        return (v.method === currentMethod && v.url === currentUrl);
    });

    if (index > -1){
        //remove
        group.allowedOperations[index] = permissionObject;
    }
    else {
        throw new Error("operation not found.")
    }
    return group.save();
}

/**
 * removes a permission to a group
 * @param {number} id group id
 * @param {String} method String denoting the html request method <["GET","POST","PUT","DELETE"]>
 * @param {String} url  the url for which the rule applies
 */

async function removePermission(id, method, url) {
    const group = await UserGroup.findById(id);
    let methods = ["GET", "POST", "PUT", "DELETE", "ALL"];
    // validate
    if (group == null) throw new Error('Group not found');
    if(!methods.includes(method)) {
        console.log("invalid method. Aborting...");
        throw new Error('Invalid method');
    }
    if(typeof url === 'string') {
        var reg = new RegExp(/^[^\/]+\/[^\/].*$|^\/[^\/].*$/gmi);
        if (!reg.test(url)){
            throw new Error("invalid url");
        }
    }
    else {
        throw new Error("url not a string");
    }

    let permissionObject = {
        method: method,
        url: url,
    };

    //find object in array
    let index = group.allowedOperations.findIndex(function(v){
        return (v.method === method && v.url === url);
    });

    if (index > -1){
        //remove
        group.allowedOperations.splice(index, 1);
    }
    else {
        throw new Error("operation not found.")
    }
    await group.save();
    return group;
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

                //query userService for user with this group assigned
                let args = {
                    filter: {
                        filter: "userGroups",
                        value: id
                    }
                }
                UserService.getAllFiltered(args)
                    .then(function(userArray){
                        resolve(userArray);
                    })
                    .catch(err => reject(err))
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
