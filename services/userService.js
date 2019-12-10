const config = require('../config/config.json');
const bcrypt = require('bcryptjs');
const db = require('../schemes/mongo');

const User = db.User;

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

async function getAll() {
    return await User.find().select('-password');
}

async function getById(id) {
    return await User.findById(id).select('-password');
}

async function getByUsername(username) {
    return await User.findOne({username: username}).select('-password');
}

async function create(userParam) {
    // validate
    if (await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    const user = new User(userParam);

    // hash password
    if (userParam.password) {
        var salt = bcrypt.genSaltSync(10);
        user.hash = bcrypt.hashSync(userParam.password, salt);
    }

    // save user
    await user.save();
}

async function update(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        //TODO: Check if plaintext password is stored
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
}

async function deleteKey(id, userParams) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';

    // validate input
    if (!userParams.key) throw 'no key given';

    // check if key exists
    if (!user.get(userParams.key)) {
        console.warn("Trying to remove invalid key!");
        return;
    }

    // check if key is in scheme
    if(!user.schema.path(userParams.key)===undefined){
        // check if trying to delete required key
        if (user.schema.path(userParams.key).isRequired){
            console.error('Trying to remove required key.');
            return;
        }
        else {
            console.log("removing key which is not specified in scheme. Is this intended?")
        }
    }

    user.set(userParams.key, undefined, {strict: false} );
    await user.save();
}

async function updateKey(id, userParams) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';

    // validate input
    if (!userParams.key) throw 'no key given';
    if (!userParams.value) throw 'no value given';

    //check if array operation
    if(userParams.isArray) {

        // in-memory update. get current array content
        // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.
        var array = user.get(userParams.key);
        if(!Array.isArray(array)) throw 'Key marked as array, but ' + typeof(array) + ' was found.';
        var index = array.map(function(e) { return e._id; }).indexOf(userParams.value.id);
        if (index > -1) {
            // updating existing object
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

async function _delete(id) {
    await User.findByIdAndRemove(id);
}