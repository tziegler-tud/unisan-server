const config = require('../config/config.json');
const bcrypt = require('bcryptjs');
const db = require('../schemes/mongo');

const User = db.User;

var fs = require('fs-extra');

module.exports = {
    getAll,
    getById,
    getByUsername,
    create,
    update,
    deleteKey,
    updateKey,
    delete: _delete
};

/** @typedef {import("../schemes/userScheme.").UserScheme} UserScheme */

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
    return await User.findById(id).select('-password');
}

/**
 * Gets a user by its username
 * @param {string} username The username to search for
 */
async function getByUsername(username) {
    return await User.findOne({username: username}).select('-password');
}

/**
 * Creates a new user by a given object of the user scheme
 * @param {UserScheme} userParam The object to save as user
 */
async function create(userParam) {
    // validate
    if (await User.findOne({ username: userParam.username }))
        throw new Error(`Username "${userParam.username}" is already taken`);

    const user = new User(userParam);

    // @louis: password is not mentioned in the userScheme. Is this correct?
    // hash password
    if (userParam.password) {
        const salt = await bcrypt.genSalt(10);
        user.hash = await bcrypt.hash(userParam.password, salt);
    }

    // save user
    if(await user.save()){
        fs.mkdir('src/data/uploads/user_images/' + user._id, { recursive: true }, (err) => {
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
 * @param {number} id The id of the existing user
 * @param {UserScheme} userParam The object to save as user
 */
async function update(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username }))
        throw new Error(`Username "${userParam.username}" is already taken`);

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
 * @param {number} id The id of the user do manipulate
 * @param {any} userParams @louis no idea what this object is
 */
async function deleteKey(id, userParams) {
    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');

    // validate input
    if (!userParams.key) throw new Error('no key given');

    // check if key exists
    if (!user.get(userParams.key)) {
        console.warn("Trying to remove invalid key!");
        return;
    }

    // check if key is in scheme
    if(user.schema.path(userParams.key)!==null) {
        // check if trying to delete required key
        if (user.schema.path(userParams.key).isRequired) {
            console.error('Trying to remove required key.');
            return;
        } else {

        }
    }
    else {
        console.warn("removing key which is not specified in scheme. Is this intended?")
    }

    if(userParams.isArray) {

        // in-memory update. get current array content
        // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.
        /** @type {any[]} */
        var array = user.get(userParams.key);
        if(!Array.isArray(array)) throw new TypeError(`Key marked as array, but "${typeof(array)}" was found.`);
        var index = array.map(e => e._id).indexOf(userParams.value.id);
        if (index > -1) {
            // remove existing key from array
            array.splice(index, 1);
        }
        else {
            // key not found
            console.error("Key marked as array, but no corresponding array entry was found. Aborting delete operation.")
        }
        user.set(userParams.key, array, {strict: false} );
    }
    else {
        user.set(userParams.key, undefined, {strict: false} );
    }
    await user.save();
}

/**
 * Updates a property of a user
 * @param {number} id The id of the user do manipulate
 * @param {*} userParams @louis no idea what this object is
 */
async function updateKey(id, userParams) {
    const user = await User.findById(id);

    // validate
    if (!user) throw new Error('User not found');

    // validate input
    if (!userParams.key) throw new Error('no key given');
    if (!userParams.value) throw new Error('no value given');

    //check if array operation
    if(userParams.isArray) {

        // in-memory update. get current array content
        // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.
        /** @type {any[]} */
        var array = user.get(userParams.key);
        if(!Array.isArray(array)) throw new TypeError(`Key marked as array, but "${typeof(array)}" was found.`);
        var index = array.map(e => e._id).indexOf(userParams.value.id);
        if (index > -1) {
            // updating existing object @louis can you use array[index] = userParams.value ?
            array.splice(index, 1, userParams.value);
        }
        else {
            // key not found, creating new entry
            array.push(userParams.value);
        }
        user.set(userParams.key, array, {strict: false} );
    }
    else {
        user.set(userParams.key, userParams.value, {strict: false} );
    }
    await user.save();
}

/**
 * Deletes a user
 * @param {number} id The id of the user to delete
 */
async function _delete(id) {
    await User.findByIdAndRemove(id);
}