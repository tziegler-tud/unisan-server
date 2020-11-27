const bcrypt = require('bcrypt');
const db = require('../../schemes/mongo');
const log = require('../../utils/log');
const AuthService = require('../authService');
const userService = require('../../services/userService');
const authService = new AuthService();

const UserGroup = db.UserGroup;
const User = db.User;
const Protocol = db.Protocol;



module.exports = {
    getAll,
    getById,
    create,
    delete: _delete,
    getUserDocuments,
};

/**
 * Gets all protocol entries
 */
async function getAll() {
    let docs = await Protocol.find().populate({
        path: 'user',
        select: 'generalData username',
    });
    return docs;
}

/**
 * Gets all user protocol entries
 */
async function getUserDocuments(username) {
    let user = await userService.getByUsername(username);
    return Protocol.find({user: user._id}).populate({
        path: 'user',
        select: 'generalData username',
    });
}

/**
 * Gets a log entry by its id
 * @param {id} id id of the event
 */
async function getById(id) {
    return Protocol.findById(id).populate({
        path: 'user',
        select: 'generalData username',
    })
}

/**
 * Creates a new doc entry and saves it to the db
 * @param req {Object} express request
 * @param {Protocol} doc JSON of protocol document to save
 */
async function create(req, doc) {
    //validation
    let object = {
        title: doc.title,
        user: req.user._id,
        completion: 0,
    }
    //save log
    let document = new Protocol(object);
    await document.save();
    return document;
}

/**
 * Deletes a protocol entry
 * @param {number} id id of log to delete
 */
async function _delete(id) {
    await Protocol.findByIdAndRemove(id);
    return true;
}

