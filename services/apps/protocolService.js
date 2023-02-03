import bcrypt from 'bcrypt';
import db from '../../schemes/mongo.js';
import AuthService from '../authService.js';
import userService from "../userService.js";
import Log from '../../utils/log.js';

const UserGroup = db.UserGroup;
const User = db.User;
const Protocol = db.Protocol;



export default {
    getAll,
    getById,
    create,
    update,
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
 * Creates a new doc entry and saves it to the db
 * @param req {Object} express request
 * @param id {Number} protocol id
 * @param {Protocol} doc JSON of protocol document to save
 */
async function update(req, id, doc) {
    //validation
    const protocol = await Protocol.findById(id);
    // validate
    if (!protocol) throw new Error('Protocol not found');

    //validation
    // copy eventParam to event
    let obj = {
        content: doc,
    }
    Object.assign(protocol, obj);

    await protocol.save();
    return protocol;
}


/**
 * Deletes a protocol entry
 * @param {number} id id of log to delete
 */
async function _delete(id) {
    await Protocol.findByIdAndRemove(id);
    return true;
}

