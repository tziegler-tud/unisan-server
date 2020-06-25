const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');

const Event = db.Event;

var fs = require('fs-extra');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */
/** @typedef {import("../schemes/eventScheme.js").EventScheme} EventScheme */

/**
 * Gets all users
 */
async function getAll() {
    return Event.find();
}

/**
 * Gets a user by its id
 * @param {number} id The id of the user
 */
async function getById(id) {
    return await Event.findById(id).select('-password');
}

/**
 * Gets a user by its username
 * @param {string} username The username to search for
 */
async function getByUsername(username) {
    return await Event.findOne({username: username}).select('-password');
}

/**
 * Creates a new user by a given object of the user scheme
 * @param {EventScheme} eventParam The object to save as event
 */
async function create(eventParam) {

    //validate
    //has title?
    if(eventParam.title){
        if(!eventParam.title.title){
            eventParam.title.title = "Name"
        }
        if(!eventParam.title.value){
            console.warn("Trying to create event with no title. Setting default...");
            eventParam.title.value = "Neues Event";
        }
    }
    else {
        eventParam.title = {
            title: "Name",
            value: "Neues Event",
        }
    }
    //has Description?
    if(eventParam.description){
        if(!eventParam.description.shortDesc){
            eventParam.description.shortDesc = "keine Kurzbeschreibung verfügbar."
        }
        if(!eventParam.description.longDesc){
            eventParam.description.longDesc = "keine Beschreibung verfügbar."
        }
    }

    const event = new Event(eventParam);

    // save event
    if(await Event.save()){
        fs.mkdir(appRoot + '/src/data/uploads/event_images/' + Event._id.toString(), { recursive: true }, (err) => {
            if (err) {
                throw err;
            }
            else {
                fs.copyFile(appRoot + '/src/data/user_images/dummy.jpg', appRoot + '/src/data/uploads/event_images/'+ Event._id + '/' + Event._id + '.jpg', { overwrite: true }, (err) => {
                    if (err) throw err;
                    console.log('dummy image copied to new event');
                });
            }
        });
        // copy dummy user image to user directory

    }
}

/**
 * Updates an existing event
 * @param {number} id The id of the existing event
 * @param {EventScheme} eventParam The object to save as event
 */
async function update(id, eventParam) {
    const event = await Event.findById(id);

    // validate
    if (!event) throw new Error('Event not found');

    // copy eventParam to event
    Object.assign(event, eventParam);

    await Event.save();
}

/**
 * Deletes an event
 * @param {number} id The id of the user to delete
 */
async function _delete(id) {
    await Event.findByIdAndRemove(id);
}
