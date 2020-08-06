const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');
const AuthService = require('./authService');

const authService = new AuthService();

const User = db.User;
const UserGroup = db.UserGroup;

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
 * Creates a new user by a given object of the user scheme
 * @param {UserScheme} userParam The object to save as user
 */
async function create(userParam) {
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

    // save user
    if(await user.save()){
        fs.mkdir(appRoot + '/src/data/uploads/user_images/' + user._id.toString(), { recursive: true }, (err) => {
            if (err) {
                throw err;
            }
            else {
                fs.copyFile(appRoot + '/src/data/user_images/dummy.jpg', appRoot + '/src/data/uploads/user_images/'+ user._id + '/' + user._id + '.jpg', { overwrite: true }, (err) => {
                    if (err) throw err;
                    console.log('dummy image copied to new user');
                });
            }
        });
        // copy dummy user image to user directory

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
    if(!authService.checkWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // hash password if it was entered
    if (userParam.password) {
        //TODO: Check if plaintext password is stored
        userParam.hash = await bcrypt.hash(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

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
    if(!authService.checkWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // validate input
    if (!key) throw new Error('no key given');

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
        user.set(key, undefined, {strict: false} );
    }
    await user.save();


}

/**
 *
 * @param req {Object} express request
 * @param id {number} The id of the user to manipulate
 * @param key {String} key to delete, use string with dot-notation
 * @param arrayElementDbId {String} Id of the array element, if available
 * @param noIndex {Boolean} if set to false, assume key contains int denoting array index after last dot
 * @returns {Promise<void>}
 */

async function deleteArrayElement(req, id, key, arrayElementDbId, noIndex) {

    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');

    //check write access
    if(!authService.checkWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // validate input
    if (!key) throw new Error('no key given');

    var array;
    if(noIndex) {
        //key refers to array.
        array = user.get(key);
    }
    //check if valid index is given. Assume key is of form: key.index
    else {
        try {
            //key refers to array element. We need to find the parent array.
            array = user.get(key).parentArray();
            var keyPos = key.lastIndexOf(".");
            var index = key.substring(keyPos+1);
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
            console.error('Trying to remove required key.');
            return;
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

    var updatedArray;
    // if array is indexed, we use id to remove the element
    if (arrayElementDbId) {
        updatedArray = removeById(array);
    }
    else {
        if (!noIndex) {
            updatedArray = removeByIndex(array);
        }
        else {
            const e = "Failed to delete array element: Wrong parameter settings.";
            console.error(e);
            throw new Error(e);
        }
        user.set(key, updatedArray, {strict: false} );
        await user.save();
    }
    function removeById(array){
        // in-memory update. get current array content
        // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.
        /** @type {any[]} */
        if(!Array.isArray(array)) throw new TypeError(`Key marked as array, but "${typeof(array)}" was found.`);

        var index = array.map(e => e._id).indexOf(arrayElementDbId);
        if (index > -1) {
            // remove existing key from array
            array.splice(index, 1);
            return array;
        }
        else {
            //try to remove by index anyway.
            if(noIndex) {
                var msg = "Array element Id was not found in array. Aborting.";
                console.error(msg);
                throw new Error(msg);
            }
            console.warn("Id was not found in array. Trying to remove by index...");
            return removeByIndex(array);
        }
    }
    // array not indexed, remove by index
    function removeByIndex(array){

        try {
            array.splice(index, 1);
            return array;
        }
        catch(e) {

        }
    }
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
    if(!authService.checkWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    // validate input
    if (!key) throw new Error('no key given');
    if (!value) throw new Error('no value given');

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
            // updating existing object @louis can you use array[index] = userParams.value ?
            array.splice(index, 1, value);
        }
        else {
            // key not found, creating new entry
            array.push(value);
        }
        user.set(key, array, {strict: false} );
    }
    else {
        user.set(key, value, {strict: false} );
    }
    await user.save();
}

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

async function addUserGroup(req, id, userGroupId){
    let user = await User.findById(id).select('-password');

    // validate
    if (!user) throw new Error('User not found');
    //check write access
    if(!authService.checkWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    let group = await UserGroup.findById(userGroupId);
    if (!group) throw new Error('UserGroup not found');

    //check if user already has userGroup assigned
    if(user.userGroups.includes(userGroupId)){
        console.log("User already has UserGroup " + group.title + "assigned.");
    }
    else {
        user.userGroups.push(userGroupId);
        await user.save();
    }
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
    if(!authService.checkWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

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
    if(!authService.checkWriteAccess(req.user, user)) throw {status: 403, message: "forbidden"};

    await User.findByIdAndRemove(id);
    return true;
}

/**
 *  generates a fresh member id
 *
 */

