const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');

const { convertDeltaToHtml } = require('node-quill-converter');

const Event = db.Event;

var fs = require('fs-extra');

module.exports = {
    getAll,
    getById,
    create,
    update,
    updateKey,
    matchAny,
    populateParticipants,
    addParticipant,
    removeParticipant,
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
 * Gets an event by its id
 * @param {number} id id of the event
 */
async function getById(id) {
    let event = await Event.findById(id).select('-password');
    return event;
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

    //has date?
    if(eventParam.date){
        if(eventParam.date.startDate === null) eventParam.date.startDate = undefined;
        if(eventParam.date.endDate === null) eventParam.date.endDate = undefined;
    }

    const event = new Event(eventParam);

    // save event
    if(await event.save()){
        fs.mkdir(appRoot + '/src/data/uploads/event_images/' + event._id.toString(), { recursive: true }, (err) => {
            if (err) {
                throw err;
            }
            else {
                fs.copyFile(appRoot + '/src/data/event_images/dummy.jpg', appRoot + '/src/data/uploads/event_images/'+ event._id + '/' + event._id + '.jpg', { overwrite: true }, (err) => {
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

    await event.save();
}

async function updateKey(id, key, value, eventParams) {
    if (!eventParams) eventParams = {};

    const event = await Event.findById(id);

    // validate
    if (!event) throw new Error('Event not found');

    // validate input
    if (!key) throw new Error('no key given');
    if (!value) throw new Error('no value given');

    //check if array operation
    if(eventParams.isArray) {

        //get current array content. Usually, key refers to an indexed array element.
        var array;
        if (eventParams.noIndex) {
        }
        else {
            const keyPos = key.lastIndexOf(".");
            const i = key.substring(keyPos+1);
            key = key.substring(0,keyPos);
        }
        array = event.get(key);
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
            // updating existing object @louis can you use array[index] = eventParams.value ?
            array.splice(index, 1, value);
        }
        else {
            // key not found, creating new entry
            array.push(value);
        }
        event.set(key, array, {strict: false} );
    }
    else {
        event.set(key, value, {strict: false} );
    }
    await event.save();
    return event;
}

async function matchAny(matchString, args){

    let eventlist;
    //matches a given string username, firstname and lastname
    //if filter is empty, return all results
    if (matchString.length === 0) {
        eventlist = Event.find();
    }
    else {
        eventlist = Event.find().or([{'title.value': { $regex: matchString, $options: "-i" }}, {'type.value': { $regex: matchString, $options: "-i" }}])

    }
    //filter user by given string, using title and type

    if (args.sort) {
        eventlist = eventlist.sort(args.sort);
    }

    return eventlist;
}

async function populateParticipants(id) {
    let event = Event.findById(id).populate({
        path: 'participants.user',
        select: 'generalData username',
    });
    return event;
}

/**
 * adds a user to the list of participants
 * @param id {ObjectId} id of the event
 * @param userId {ObjectId} id of user to add
 * @param args {Object} allowed values: [admin, lecturer, participant]
 * @returns {Promise<void>}
 */
async function addParticipant(id, userId, args) {
    const event = await Event.findById(id);
    let roles = ["admin", "lecturer", "participant"];
    let rolesDefault = "participant";
    let role = args.role;

    // validate
    if (!event) throw new Error('Event not found');
    if(!roles.includes(role)) {
        console.log("invalid role name. setting as default: " + rolesDefault);
        role = rolesDefault;
    }
    let data = {
        user: userId,
        role: role,
    }

    // check if user is already registered as participant
    try {
        //check if array
        var index = event.participants.map(e => e.user._id).indexOf(userId);
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
        // user already registered.
        if(!args.overwrite){
            //abort
            console.log("user " + userId + " already registered for Event "+ event.title.value);
        }
        else {
            //overwrite
            event.participants.splice(index, 1, data);
        }

    }
    else {
        // push user to participants array
        event.participants.push(data);
    }

    await event.save();
}

async function removeParticipant(id, userId, args) {
    if (args === undefined) args = {};
    const event = await Event.findById(id);
    let role = args.role;

    // validate
    if (!event) throw new Error('Event not found');

    // check if user is already registered as participant
    try {
        //check if array
        var index = event.participants.map(e => e.user._id).indexOf(userId);
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
        // user found. removing
        event.participants.splice(index, 1);
    }
    else {
        // user not found. abort
        throw new Error("user not found");
    }
    await event.save();
}


/**
 * Deletes an event
 * @param {number} id The id of the user to delete
 */
async function _delete(id) {
    await Event.findByIdAndRemove(id);
}
