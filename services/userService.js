const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');
const AuthService = require('./authService');
const LogService = require("./logService");
const Log = require('../utils/log');



const User = db.User;
const UserGroup = db.UserGroup;
const DbLog = db.Log;

var fs = require('fs-extra');

module.exports = {
    getAll,
    getById,
    getByUsername,
    create,
    update,
    deleteKey,
    deleteArrayElement,
    updateKey,
    getKey,
    delete: _delete,
    matchAny,
    addUserGroup,
    removeUserGroup,
    setUserRole,
};

/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */

/**
 * Gets all users
 */
async function getAll() {
    return User.find().select('-password');
}

/**
 * Gets a user by its id
 * @param {number} id The id of the user
 */
async function getById(id) {
    //populate userGroups
    return User.findById(id).select('-password').populate({
            path: 'userGroups',
            select: 'title',
        });
    // let user = User.findById(id).select('-password').populate({
    //     path: 'userGroups',
    //     select: 'title',
    // });
    // return user;

}

/**
 * Gets a user by its username
 * @param {string} username The username to search for
 */
async function getByUsername(username) {
    return User.findOne({username: username}).select('-password').populate({
        path: 'userGroups',
        select: 'title',
    })
}

/**
 *
 * Creates a new user by a given object of the user scheme
 * @param req {Object} express request
 * @param userParam {UserScheme} The object to save as user
 * @param args {Object} further args for user creation. args = {userImg: {tmp: <boolean>, tmpKey: <integer>}}
 */
async function create(req, userParam, args) {
    if (args === undefined) args = {};

    // validate
    if (await User.findOne({ username: userParam.username }))
        throw new Error(`Username "${userParam.username}" is already taken`);

    if (await User.findOne({ generalData: {memberId: userParam.generalData.memberId }}))
        throw new Error(`MemberId ` + userParam.generalData.memberId + ` is already taken`);

    const user = new User(userParam);

    // @louis: password is not mentioned in the userScheme. Is this correct?
    // hash password
    if (userParam.password) {
        const salt = await bcrypt.genSalt(10);
        user.hash = await bcrypt.hash(userParam.password, salt);
    }

    //create log
    let log = new Log({
        type: "modification",
        action: {
            objectType: "user",
            actionType: "create",
            actionDetail: "userCreate"
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

    // save user
    if(await user.save()){
        //update log
        LogService.create(log)
            .then(
        )
            .catch(

        );
        //create user dir
        fs.mkdir(appRoot + '/src/data/uploads/user_images/' + user._id.toString(), { recursive: true }, (err) => {
            if (err) {
                throw err;
            }
            else {
                //check if tmp image exists
                if (args.userImg.tmp) {
                    fs.copyFile(appRoot + '/src/data/uploads/tmp/' + args.userImg.tmpkey + ".jpg", appRoot + '/src/data/uploads/user_images/'+ user._id + '/' + user._id + '.jpg', { overwrite: true }, (err) => {
                        if (err) throw err;
                    });
                }
                else {
                    // copy dummy user image to user directory
                    fs.copyFile(appRoot + '/src/data/user_images/dummy.jpg', appRoot + '/src/data/uploads/user_images/'+ user._id + '/' + user._id + '.jpg', { overwrite: true }, (err) => {
                        if (err) throw err;
                        console.log('dummy image copied to new user');
                    });
                }

            }
        });
    }
}

/**
 * Updates an existing user
 * @param req {Object} express request
 * @param {number} id The id of the existing user
 * @param {UserScheme} userParam The object to save as user
 */
async function update(req, id, userParam) {

    const user = await User.findById(id);
    // validate
    if (!user) throw new Error('User not found');
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username }))
        throw new Error(`Username "${userParam.username}" is already taken`);

    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // hash password if it was entered
    if (userParam.password) {
        //TODO: Check if plaintext password is stored
        userParam.hash = await bcrypt.hash(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    user.validate(function(err){
        if (err){
            console.log("Validation failed: " + err)
        }
        else {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "user",
                    actionType: "modify",
                    actionDetail: "userModify",
                    key: "",
                    fullKey: "",
                    originalValue: "",
                    value:  "",
                    tag: "<OVERWRITE>"
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
        }
    })
    await user.save();
}

/**
 * Deletes a property of a given user
 * @param req {Object} express request
 * @param {number} id The id of the user to manipulate
 * @param {string} key Key to be deleted
 * @param {Object} userParams containing additional settings. Valid properties are: {isArray <bool>, noIndex: <bool> (true if key does not contain array element index)}
 */
async function deleteKey(req, id, key, userParams) {
    if (userParams === undefined) userParams = {};

    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');

    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // validate input
    if (!key) throw new Error('no key given');

    let ojVal = undefined;
    let logKey = key;

    // check if key exists
    if (!user.get(key)) {
        console.warn("Trying to remove invalid key!");
        return;
    }

    // check if key is in scheme
    if(user.schema.path(key)!==undefined) {
        // check if trying to delete required key
        if (user.schema.path(key).isRequired) {
            console.error('Trying to remove required key.');
            return;
        } else {

        }
    }
    else {
        console.warn("removing key which is not specified in scheme. Is this intended?")
    }

    // check if key references array element
    if (Array.isArray(user.get(key).parentArray())){
        var msg = "Error: Deleting array elements is no longer provided by this method.";
        console.error(msg);
        throw new Error(msg);
    }
    else {
        let k = user.get(key);
        ojVal = (k.value === undefined) ? k : k.value;
        logKey = (k.title === undefined) ? key : k.title;
        user.set(key, undefined, {strict: false} );
    }
    user.validate(function(err){
        if (err){
            console.log("Validation failed: " + err)
        }
        else {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "user",
                    actionType: "modify",
                    actionDetail: "userModify",
                    key: logKey,
                    fullKey: key,
                    originalValue: ojVal,
                    value:  "",
                    tag:  "<DELETED>",
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
        }
    })
    await user.save();


}

/**
 *
 * @param req {Object} express request
 * @param id {number} The id of the user to manipulate
 * @param key {String} key to delete, use string with dot-notation
 * @param noIndex {Boolean} if set to false, assume key contains int denoting array index after last dot
 * @param arrayElementDbId {number} Id of the array element, if available
 *
 * @returns {Promise<void>}
 */

async function deleteArrayElement(req, id, key, args) {

    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');

    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // validate input
    if (!key) throw new Error('no key given');
    if (args === undefined || typeof(args) !== 'object') args = {};
    var noIndex = args.noIndex;
    var arrayElementDbId = args.arrayElementDbId;
    // if (arrayElementDbId === undefined) arrayElementDbId = 0;
    if (noIndex === undefined) noIndex = false;

    let ojVal = undefined;
    let logKey = key;

    var array;
    var parentArray;
    var index;

    if(noIndex) {
        //key refers to array.
        parentArray = user.get(key);
        if(arrayElementDbId === undefined) {
            const e = "Failed to delete array element: Wrong parameter settings.";
            console.error(e);
            throw new Error(e);
        }
    }
    //check if valid index is given. Assume key is of form: key.index
    else {
        try {
            //key refers to array element. We need to find the parent array.
            parentArray = user.get(key).parentArray();
            let keyPos = key.lastIndexOf(".");
            index = parseInt(key.substring(keyPos+1));
            //TODO: validate index using regex
            key = key.substring(0,keyPos);
        }
        catch(e) {
            console.warn("Failed to parse key to array element. Aborting delete operation.");
            throw(e);
            // we could try to catch other key types here, but we dont want to perform delete operation if something is not as intended. Better safe than sorry.
        }
    }

    // check if key exists
    if (!user.get(key)) {
        console.warn("Trying to remove invalid key!");
        return;
    }

    // check if key is in scheme
    if(user.schema.path(key)!==undefined) {
        // check if trying to delete required key
        if (user.schema.path(key).isRequired) {
            let msg = 'Trying to remove required key.';
            console.error(msg);
            throw new Error(msg);
        } else {

        }
    }
    else {
        console.warn("removing key which is not specified in scheme. Is this intended?")
    }

    // check if key is array
    if (!Array.isArray(user.get(key))){
        const msg = "Error: Key is not referencing an array.";
        console.error(msg);
        throw new Error(msg);
    }
    array = user.get(key)

    var updatedArray;
    // if array is indexed, we use id to remove the element
    if (arrayElementDbId !== undefined) {
        let rmObj = removeById(array, arrayElementDbId);
        updatedArray = rmObj.array;
        let el = rmObj.object;
        logKey = (el.title === undefined) ? el : el.title;
        ojVal  = (el.value === undefined) ? el : el.value;
    }
    else {
        if (!noIndex) {
            let rmObj = removeByIndex(array, index);
            updatedArray = rmObj.array;
            let el = rmObj.object;
            logKey = (el.title === undefined) ? el : el.title;
            ojVal  = (el.value === undefined) ? el : el.value;
        }
        else {
            const e = "Failed to delete array element: Wrong parameter settings.";
            console.error(e);
            throw new Error(e);
        }
    }
    user.set(key, updatedArray, {strict: false} );
    user.validate(function(err){
        if (err){
            console.log("Validation failed: " + err)
        }
        else {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "user",
                    actionType: "modify",
                    actionDetail: "userModify",
                    key: logKey,
                    fullKey: key,
                    originalValue: ojVal,
                    value:  "",
                    tag:  "<DELETED>",
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
        }
    })
    await user.save();
}

/**
 * Retrieves a property of a user
 * @param {number} id The id of the user do manipulate
 * @param {string} key key to retrieve
 */
async function getKey(id, key) {
    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');
    // validate input
    if (!key) throw new Error('no key given');

    return await user.get(key);
}


/**
 * Updates a property of a user, or inserts a new property if it doesnt exist
 * If the key is marked as array, the value is expected to be a JSON object of form value = {id: <ObjectId>, yourData..., ...}
 *
 * Note: this can be used to modify qualification entries, but it is recommended to use the dedicated api calls for qulification manipulation.
 *
 * @param req {Object} express request
 * @param {number} id The id of the user do manipulate
 * @param {string} key the key to update
 * @param {string} value the new value for the key
 * @param {Object} userParams containing additional settings. Valid properties are: {isArray: <bool>, noIndex: <bool>}
 */
async function updateKey(req, id, key, value, userParams) {
    if (!userParams) userParams = {};

    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');

    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // validate input
    if (!key) throw new Error('no key given');
    if (!value) throw new Error('no value given');

    let ojVal = undefined;
    let newVal = (value.value === undefined) ? value : value.value;
    let logKey = (value.title === undefined) ? key : value.title;

    //check if array operation
    if(userParams.isArray) {

        //get current array content. Usually, key refers to an indexed array element.
        var array;
        if (userParams.noIndex) {
        }
        else {
            const keyPos = key.lastIndexOf(".");
            const i = key.substring(keyPos+1);
            key = key.substring(0,keyPos);
        }
        array = user.get(key);
        // in-memory update.
        // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.

        try {
            if (!Array.isArray(array)) throw new TypeError(`Key marked as array, but "${typeof (array)}" was found.`);
            //check if array
            var index = array.map(e => e._id).indexOf(value.id);
        }
        catch (e) {
            if (e instanceof TypeError) {
                console.error("Exception:" + e);
                console.error("Aborting operation to ensure data integrity.");
                throw e;
            } else {
                console.error("Unhandled exception: " + e);
                throw e;
            }
        }
        if (index > -1) {
            // updating existing object
            ojVal = array[index];
            array.splice(index, 1, value);
        }
        else {
            // key not found, creating new entry
            array.push(value);
        }
        user.set(key, array, {strict: false} );
    }
    else {
        let k = user.get(key);
        ojVal = (k.value === undefined) ? k : k.value;
        user.set(key, value, {strict: false} );
    }
    user.validate(function(err){
        if (err){
            console.log("Validation failed: " + err)
        }
        else {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "user",
                    actionType: "modify",
                    actionDetail: "userModify",
                    key: logKey,
                    fullKey: key,
                    originalValue: ojVal,
                    value:  newVal,
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
        }
    })
    await user.save();
    return user;
}

async function addQualification(req, id, key, value, userParams) {
    if (!userParams) userParams = {};

    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');

    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // validate input
    if (!key) throw new Error('no key given');
    if (!value) throw new Error('no value given');

    let ojVal = undefined;
    let newVal = (value.value === undefined) ? value : value.value;
    let logKey = (value.title === undefined) ? key : value.title;

    //check if array operation
    if(userParams.isArray) {

        //get current array content. Usually, key refers to an indexed array element.
        var array;
        if (userParams.noIndex) {
        }
        else {
            const keyPos = key.lastIndexOf(".");
            const i = key.substring(keyPos+1);
            key = key.substring(0,keyPos);
        }
        array = user.get(key);
        // in-memory update.
        // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.

        try {
            if (!Array.isArray(array)) throw new TypeError(`Key marked as array, but "${typeof (array)}" was found.`);
            //check if array
            var index = array.map(e => e._id).indexOf(value.id);
        }
        catch (e) {
            if (e instanceof TypeError) {
                console.error("Exception:" + e);
                console.error("Aborting operation to ensure data integrity.");
                throw e;
            } else {
                console.error("Unhandled exception: " + e);
                throw e;
            }
        }
        if (index > -1) {
            // updating existing object
            ojVal = array[index];
            array.splice(index, 1, value);
        }
        else {
            // key not found, creating new entry
            array.push(value);
        }
        user.set(key, array, {strict: false} );
    }
    else {
        let k = user.get(key);
        ojVal = (k.value === undefined) ? k : k.value;
        user.set(key, value, {strict: false} );
    }
    user.validate(function(err){
        if (err){
            console.log("Validation failed: " + err)
        }
        else {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "user",
                    actionType: "modify",
                    actionDetail: "userModify",
                    key: logKey,
                    fullKey: key,
                    originalValue: ojVal,
                    value:  newVal,
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
        }
    })
    await user.save();
}

/**
 *
 * updates a single qualification entry of user
 * @param {Object} req - express request object.
 * @param {number} id - user id
 * @param {number} qualificationId - qualification entrie id. Note this is not the qualficiation id from qualification collection.
 * @param {Object} value - qualification object
 * @param {Object} userParams - parameters: upsert <Boolean> inserts new entry if id is not present
 * @returns {Promise<void>}
 */

async function updateQualification(req, id, qualificationId, value, userParams) {
    if (!userParams) userParams = {};

    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');

    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // validate input
    if (!key) throw new Error('no key given');
    if (!value) throw new Error('no value given');

    let ojVal = undefined;
    let newVal = value;
    let logKey = (value.title === undefined) ? key : value.title;

   var array = user.qualifications;
    // get current array content. Qualifications array is access by mongo ids.
    // in-memory update.
    // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.

    try {
        if (!Array.isArray(array)) throw new TypeError(`Failed to read qualifications array.`);
        //check if array
        var index = array.map(e => e._id).indexOf(qualificationId);
    }
    catch (e) {
        if (e instanceof TypeError) {
            console.error("Exception:" + e);
            console.error("Aborting operation to ensure data integrity.");
            throw e;
        } else {
            console.error("Unhandled exception: " + e);
            throw e;
        }
    }
    if (index > -1) {
        // updating existing object
        ojVal = array[index];
        array.splice(index, 1, value);
    }
    else {
        if (userParams.upsert) {
            // key not found, creating new entry
            array.push(value);
        }
        else throw new Error("Failed to update qualification entry: Invalid array id given");
    }
    let key = "qualifications";
    user.set(key, array, {strict: false} );
    user.validate(function(err){
        if (err){
            console.log("Validation failed: " + err)
        }
        else {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "user",
                    actionType: "modify",
                    actionDetail: "userModify",
                    key: logKey,
                    fullKey: key,
                    originalValue: ojVal,
                    value:  newVal,
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
        }
    })
    await user.save();
}

async function removeQualification(req, id, qualificationId, userParams) {
    if (!userParams) userParams = {};
    const user = await User.findById(id);
    // validate
    if (!user) throw new Error('User not found');
    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};
    // validate input
    if (qualificationId === undefined ) throw new Error("qualification not found: undefined id")
    //get current array content. Usually, qualificationId refers to corresponding id in the array.
    // Otherwise, use the isIndex parameter to allow accessing array by index
    var array = user.qualifications;
    let logKey = "qualifications";
    let fullKey = logKey;
    let ojVal = "";
    if (userParams.isIndex) {
        //qualificationId is array index
        let fullKey = logKey + "." + (qualificationId).toString();
        let rmObj = removeByIndex(array, qualificationId);
        array = rmObj.array;
        ojVal = rmObj.value;
    }
    else {
        //qualificationId is id
        let fullKey = logKey + "/" + (qualificationId).toString();
        let rmObj = removeById(array, qualificationId);
        array = rmObj.array;
        ojVal = rmObj.value;
    }
    let key = "qualifications";
    let value = array;
    user.set(key, value, {strict: false} );

    user.validate(function(err){
        if (err){
            console.log("Validation failed: " + err)
        }
        else {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "user",
                    actionType: "modify",
                    actionDetail: "userModify",
                    key: logKey,
                    fullKey: fullKey,
                    originalValue: ojVal,
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
        }
    })
    await user.save();
}


/**
 *
 * @param matchString
 * @param args
 * @returns {Promise<Query|*|number>}
 */
async function matchAny(matchString, args){

    if (args === undefined) args = {sort: "username"}
    let userlist;
    //matches a given string username, firstname and lastname
    //if filter is empty, return all results
    if (matchString.length === 0) {
        userlist = User.find();
    }
    else {
        userlist = User.find().or([{username: { $regex: matchString, $options: "-i" }}, {'generalData.firstName.value': { $regex: matchString, $options: "-i" }}, {'generalData.lastName.value': { $regex: matchString, $options: "-i" }}])

    }
    //filter user by given string, using username, firstname and lastname attribute

    if (args.sort) {
       userlist = userlist.sort(args.sort);

    }

    return userlist;
}

/**
 * adds user to group
 * @param req {Object} express request
 * @param id user id
 * @param userGroupId id of group the user should be added to
 * @returns {Promise<*>}
 */

async function addUserGroup(req, id, userGroupId){
    let user = await User.findById(id).select('-password');

    // validate
    if (!user) throw new Error('User not found');
    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    let group = await UserGroup.findById(userGroupId);
    if (!group) throw new Error('UserGroup not found');

    //check if user already has userGroup assigned
    if(user.userGroups.includes(userGroupId)){
        console.log("User " + user.username + " already has UserGroup " + group.title + " assigned.");
        return user;
    }
    else {
        user.userGroups.push(userGroupId);
        await user.save();
    }
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
    return user;
}

/**
 * removes user from group
 * @param req {Object} express request
 * @param id user id
 * @param userGroupId id of group the user should be removed from
 * @returns {Promise<*>}
 */

async function removeUserGroup(req, id, userGroupId){
    let user = await User.findById(id).select('-password');

    // validate
    if (!user) throw new Error('User not found');
    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    let group = await UserGroup.findById(userGroupId);
    if (!group) throw new Error('invalid user group');

    //check if user has userGroup assigned
    let index = user.userGroups.indexOf(userGroupId);
    if(index > -1){
        // remove group
        user.userGroups.splice(index, 1);
        await user.save();
    }
    else {
        console.log("User " + user.username + " is not part of group " + group.title);
        return false;
    }
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
    return user;
}

/**
 *
 * @param req {Object} express request
 * @param id {number} user id
 * @param role {String} role
 * @returns {Promise<*>}
 */

async function setUserRole(req, id, role, currentUser){
    let user = await User.findById(id).select('-password');
    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    let validRoles = AuthService.roles;
    // validate
    if (!user) throw new Error('User not found');
    if(typeof(role) === 'string'){
        if(!validRoles.includes(role)){
            throw new Error("invalid role name");
        }
    }
    else {
        throw new TypeError("invalid data type: parameter 'role' expected to be string, but was" + typeof(role));
    }
    //cant set role higher than user role
    if (AuthService.rolesMap[role] > AuthService.rolesMap[currentUser.userRole]){
        throw {status: 403, message: "insufficient access rights"};
    }
    //set new role
    user.userRole = role;
    await user.save();

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
    return user;
}


/**
 * Deletes a user
 * @param req {Object} express request
 * @param {number} id The id of the user to delete
 */
async function _delete(req, id) {

    let user = await User.findById(id).select("userRole");
    //check write access
    if(!AuthService.checkUserWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // await User.findByIdAndRemove(id);
    User.findByIdAndRemove(id)
        .then(function(user){
            console.log("Deleted user with id: " + user._id);
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "user",
                    actionType: "delete",
                    actionDetail: "userDelete",
                    key: user.id,
                    originalValue: user.username,
                    value: "",
                    tag: "<DELETE>"
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
            LogService.create(log)
                .then()
                .catch()
            //TODO: update exisiting logs for user
            return true;
        })
        .catch()
}

/*
helpers
 */


/**
 *
 * removes an element from an array by its mongo id
 *
 * @param {Object} array - array to remove element from
 * @param {number} id - mongo id of element to be removed
 * @returns {{array: {Object}, object: {Object}}}
 */
function removeById(array, id){
    // in-memory update. get current array content
    // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.
    /** @type {any[]} */
    if(!Array.isArray(array)) throw new TypeError(`Key marked as array, but "${typeof(array)}" was found.`);

    var index = array.map(e => e._id).indexOf(id);
    if (index > -1) {
        // remove existing key from array
        let el = array[index];
        array.splice(index, 1);
        return {array: array, object: el};
    }
    else {
    //try to remove by index anyway.
        var msg = "Array element Id was not found in array. Aborting.";
        console.error(msg);
        throw new Error(msg);
    }
}

/**
 * removes an element from an array by its index
 *
 * @param {Object} array - array to remove element from
 * @param {number} index - index of element to remove. Note that arrays are 0-indexed.
 *
 * @returns {{array: {Object}, object: {Object}}}
 */
function removeByIndex(array, index){
    // array not indexed, remove by index
    try {
        let el = array[index];
        let key = (el.title === undefined) ? "" : el.title;
        let val = (el.value === undefined) ? el : el.value;
        array.splice(index, 1);
        return {array: array, object: el};
    }
    catch(e) {
        throw new Error(e);
    }
}