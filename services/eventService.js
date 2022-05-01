const bcrypt = require('bcrypt');
const db = require('../schemes/mongo');
const AuthService = require('./authService');
const LogService = require("./logService");
const UserService = require("./userService");
const Log = require('../utils/log');


// const authService = new AuthService();

const { convertDeltaToHtml, convertTextToDelta, convertHtmlToDelta } = require('node-quill-converter');

const Event = db.Event;
const User = db.User;

var fs = require('fs-extra');

module.exports = {
    getAll,
    getAllFiltered,
    getUpcoming,
    getById,
    create,
    update,
    updateKey,
    matchAny,
    populateParticipants,
    addParticipant,
    removeParticipant,
    delete: _delete,

    addFileReference,
    removeFileReference,
};

/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */
/** @typedef {import("../schemes/eventScheme.js").EventScheme} EventScheme */

/**
 * Gets all events
 */
async function getAll() {
    return Event.find();
}

/**
 * Gets all events that are in the future
 */
async function getUpcoming() {
    //date.startDate must be in the future
    //event doc holds native js date object
    return new Promise(function(resolve, reject){
        let currentDate = new Date().toISOString(); //Date object
        Event.find({"date.endDate": { $gte: currentDate}})
            .then(eventList => {
                resolve(eventList)
            })
            .catch(err => {
                reject(err)
            })
    })
}


/**
 *
 * @param args
 * @returns {Promise<[Event]>}
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
        query = Event.find();
    }
    else {
        let filterObj = {};
        filterObj[filter.filter] = filter.value;
        query = Event.find(filterObj);
    }

    if(sort === undefined) {
        return query;
    }
    else {
        return query.sort(sort);
    }
}


/**
 * Gets an event by its id
 * @param {number} id id of the event
 */
async function getById(id) {
    return Event.findById(id);
}


/**
 *
 * @param matchString {String} String to match title
 * @param args
 * @param args.sort {Object} mongoose sort object - can be a simple string to sort for a property, or an object according to docs
 * @param args.filter {Object} universal mongodb filter object to be applied to query
 * @param args.dateFilter {Object} Object to set date filtering
 * @param args.dateFilter.date {Date} start of Date range to filter for. Default to current Date
 * @param args.dateFilter.minDate {Date} end of Date range to filter for. Defaults to current Date
 * @param args.dateFilter.maxDate {Date} end of Date range to filter for. Defaults to current Date
 * @param args.dateFilter.selector {String} String denoting how to filter. Accepts: ["match", "gte", "lte", "range"].
 * @returns {Promise<Query|*|number>}
 */
async function matchAny(matchString, args){
    //matches a given string username, firstname and lastname, and optionally filters by date
    let eventlist;
    let dateFilter = {};
    let universalFilter = {};

    if (args.filter===undefined || args.filter.filter === undefined || args.filter.value === undefined) {

    }
    else {
        let filterObj = {};
        filterObj[args.filter.filter] = args.filter.value;
        universalFilter = filterObj;
    }

    if (args.dateFilter === undefined) args.dateFilter = {}
    if(args.dateFilter.selector === undefined || typeof(args.dateFilter.selector) !== "string") {
        //invalid paramters for date filtering. ignore
    }
    else {
        //wrap date
        if (args.dateFilter.date === undefined) args.dateFilter.date = Date.now();
        if (args.dateFilter.minDate === undefined) args.dateFilter.minDate = Date.now();
        if (args.dateFilter.maxDate === undefined) args.dateFilter.maxDate = Date.now();
        let d = new Date(args.dateFilter.date);
        let min = new Date(args.dateFilter.minDate);
        let max = new Date(args.dateFilter.maxDate);
        if (isNaN(d.getTime())) {
            //failed to parse date.
        }
        else {
            let inner;
            let innerFilter = {};
            switch (args.dateFilter.selector){
                case "match":
                    inner = {
                        date: d.toISOString(),
                        selector: ""
                    }
                    innerFilter = inner.date;
                    break;
                case "gte":
                    inner = {
                        date: d.toISOString(),
                        selector: "$gte"
                    }
                    innerFilter[inner.selector] = inner.date;
                    break;
                case "lte":
                    inner = {
                        date: d.toISOString(),
                        selector: "$lte"
                    }
                    innerFilter[inner.selector] = inner.date;
                    break;
                case "range":
                    if (isNaN(min.getTime()) || isNaN(min.getTime())) {
                        //failed to parse date.
                    }
                    inner = {
                        min: min.toISOString(),
                        max: max.toISOString(),
                    }
                    innerFilter["$gte"] = inner.min;
                    innerFilter["$lte"] = inner.max;
            }
            dateFilter = {"date.endDate": innerFilter}
        }
    }

    //if filter is empty, return all results
    if (matchString.length === 0) {
        eventlist = Event.find().and([dateFilter, universalFilter]);
    }
    else {
        //filter user by given string, using title and type
        // eventlist = Event.find().and([dateFilter, universalFilter]).or([{'title.value': { $regex: matchString, $options: "-i" }}, {'type.value': { $regex: matchString, $options: "-i" }}])
        eventlist = Event.find().and([dateFilter, universalFilter, {'title.value': { $regex: matchString, $options: "-i" }}]); //dont filter for type
    }

    if (args.sort) {
        eventlist = eventlist.sort(args.sort);
    }



    return eventlist;
}


/**
 *
 * @param req {Object} express request
 * Creates a new user by a given object of the user scheme
 * @param {EventScheme} eventParam The object to save as event
 */
async function create(req, eventParam) {

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
        if(!eventParam.title.delta){
            console.warn("Trying to create event with no title. Building from value...");
            eventParam.title.delta = convertTextToDelta(eventParam.title.value);
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

    //create log
    let log = new Log({
        type: "modification",
        action: {
            objectType: "event",
            actionType: "create",
            actionDetail: "eventCreate",
            key: event.id,
            value: event.title.value,
        },
        authorizedUser: req.user,
        target: {
            targetType: "event",
            targetObject: event._id,
            targetObjectId: event._id,
            targetModel: "Event",
        },
        httpRequest: {
            method: req.method,
            url: req.originalUrl,
        }
    })

    // save event
    if(await event.save()){
        LogService.create(log)
            .then(
            )
            .catch(

            );
        fs.mkdir(appRoot + '/src/data/uploads/event_images/' + event._id.toString(), { recursive: true }, (err) => {
            if (err) {
                throw err;
            }
            else {
                fs.copyFile(appRoot + '/src/data/event_images/dummy.jpg', appRoot + '/src/data/uploads/event_images/'+ event._id + '/' + event._id + '.jpg', (err) => {
                    if (err) throw err;
                    console.log('dummy image copied to new event');
                });
            }
        });
        fs.mkdir(appRoot + '/src/data/uploads/event_files/' + event._id.toString(), { recursive: true }, (err) => {
            if (err) {
                throw err;
            } else {
            }
        });
    }
}

/**
 * Updates an existing event
 *
 * @param req {Object} express request
 * @param {number} id The id of the existing event
 * @param {EventScheme} eventParam The object to save as event
 */
async function update(req, id, eventParam) {
    const event = await Event.findById(id);

    // validate
    if (!event) throw new Error('Event not found');

    // copy eventParam to event
    Object.assign(event, eventParam);

    event.validate(function(err){
        if (err){
            console.log("Validation failed: " + err)
        }
        else {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "event",
                    actionType: "modify",
                    actionDetail: "eventModify",
                    key: "",
                    fullKey: "",
                    originalValue: "",
                    value:  "",
                    tag: "<OVERWRITE>"
                },
                authorizedUser: req.user,
                target: {
                    targetType: "event",
                    targetObject: event._id,
                    targetObjectId: event._id,
                    targetModel: "Event",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
            LogService.create(log).then().catch();
        }
    })
    await event.save();
}

/**
 *
 * @param req {Object} express request
 * @param id
 * @param key
 * @param value
 * @param eventParams
 * @returns {Promise<*>}
 */
async function updateKey(req, id, key, value, eventParams) {
    if (!eventParams) eventParams = {};

    const event = await Event.findById(id);

    // validate
    if (!event) throw new Error('Event not found');

    // validate input
    if (!key) throw new Error('no key given');
    if (!value) throw new Error('no value given');

    let ojVal = undefined;
    let newVal = (value.value === undefined) ? value : value.value;
    let logKey = (value.title === undefined) ? key : value.title;

    return new Promise(function(resolve, reject){
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
                var index = array.map(e => e._id.toString()).indexOf(value.id);
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
                ojVal = array[index];
                array.splice(index, 1, value);
            }
            else {
                // key not found, creating new entry
                array.push(value);
            }
            event.set(key, array, {strict: false} );
        }
        else {
            let k = event.get(key);
            if (k === undefined) {
                ojVal = "N/A"
            }
            else {
                ojVal = (k.value === undefined) ? k : k.value;
            }
            event.set(key, value, {strict: false} );
        }

        event.save()
            .then(event => {
                // create log
                resolve(event);
                let log = new Log({
                    type: "modification",
                    action: {
                        objectType: "event",
                        actionType: "modify",
                        actionDetail: "eventModify",
                        key: logKey,
                        fullKey: key,
                        originalValue: ojVal,
                        value:  newVal,
                    },
                    authorizedUser: req.user,
                    target: {
                        targetType: "event",
                        targetObject: event._id,
                        targetObjectId: event._id,
                        targetModel: "Event",
                    },
                    httpRequest: {
                        method: req.method,
                        url: req.originalUrl,
                    }
                })
                LogService.create(log).then().catch();
            })
            .catch(err => reject(err));
    })

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
 *
 * @param req {Object} express request
 * @param id {ObjectId} id of the event
 * @param userId {ObjectId} id of user to add
 * @param args {{role: [String], overwrite: <Boolean>}} role: [admin, lecturer, participant], overwrite: if the user already is registered, overwrite: true will update the participants role.
 * @returns {Promise<void>}
 */
async function addParticipant(req, id, userId, args) {
    const event = await Event.findById(id);
    const user = await User.findById(userId).select("username");
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

    let operationsArray = [
          AuthService.operations.events.READ,
          AuthService.operations.events.WRITE,
    ]

    // check if user is already registered as participant
    try {
        //check if user is registered
        // var index = event.participants.map(e => e.user._id).indexOf(userId); //requires populated user objects

        // we currently do not populate the user objects for this step, so we need to match the ObjectId to userId
        var index = event.participants.map(e => e.user.toString()).indexOf(userId);
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
    var log;

    if (index > -1) {
        // user already registered.
        if(!args.overwrite){
            //abort
            console.log("user " + userId + " already registered for Event "+ event.title.value);
        }
        else {
            //overwrite

            //check if user was admin
            if(event.participants[index].role === "admin"){
                removeEventAdmin(req,event,user)
                    .then(result => {
                        // console.log("individual access rights removed from user "+ user.username);
                    })
                    .catch(err => {
                        console.error(err)
                    })
            }
            event.participants.splice(index, 1, data);

            if(role === "admin") {
                addEventAdmin(req, event, user, operationsArray)
                    .then(result => {
                        console.log("individual access rights added to user "+ user.username);
                    })
                    .catch(err => {
                        console.error(err)
                    })
            }

            log = new Log({
                type: "modification",
                action: {
                    objectType: "event",
                    actionType: "modify",
                    actionDetail: "eventChangeParticipantRole",
                    key: user.username,
                    value:  role,
                },
                authorizedUser: req.user,
                target: {
                    targetType: "event",
                    targetObject: event._id,
                    targetObjectId: event._id,
                    targetModel: "Event",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
        }

    }
    else {
        // push user to participants array
        event.participants.push(data);
        if(role === "admin") {
            addEventAdmin(req, event, user, operationsArray)
                .then(result => {
                    console.log("individual access rights added to user "+ user.username);
                })
                .catch(err => {
                    console.error(err)
                })
        }
        log = new Log({
            type: "modification",
            action: {
                objectType: "event",
                actionType: "modify",
                actionDetail: "eventAddParticipant",
                key: user.username,
                value:  role,
            },
            authorizedUser: req.user,
            target: {
                targetType: "event",
                targetObject: event._id,
                targetObjectId: event._id,
                targetModel: "Event",
            },
            httpRequest: {
                method: req.method,
                url: req.originalUrl,
            }
        })

    }

    return event.save()
        .then(result => {
            //create log
            LogService.create(log).then().catch();
        })


}

/**
 *
 * @param req {Object} express request
 * @param id
 * @param userId
 * @param args
 * @returns {Promise<void>}
 */
async function removeParticipant(req, id, userId, args) {
    if (args === undefined) args = {};
    const event = await Event.findById(id);
    const user = await User.findById(userId).select("username");
    let role = args.role;

    // validate
    if (!event) throw new Error('Event not found');

    // check if user is already registered as participant
    try {
        //check if array
        // var index = event.participants.map(e => e.user._id).indexOf(userId);
        var index = event.participants.map(e => e.user.toString()).indexOf(userId);
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
        if(event.participants[index].role === "admin"){
            removeEventAdmin(req,event,user)
                .then(result => {
                    console.log("individual access rights removed from user "+ user.username);
                })
                .catch(err => {
                    console.error(err)
                })
        }
        // user found. removing
        event.participants.splice(index, 1);
        //create log
        let log = new Log({
            type: "modification",
            action: {
                objectType: "event",
                actionType: "modify",
                actionDetail: "eventRemoveParticipant",
                key: user.username,
            },
            authorizedUser: req.user,
            target: {
                targetType: "event",
                targetObject: event._id,
                targetObjectId: event._id,
                targetModel: "Event",
            },
            httpRequest: {
                method: req.method,
                url: req.originalUrl,
            }
        })
        LogService.create(log).then().catch();
    }
    else {
        // user not found. abort
        throw new Error("user not found");
    }
    await event.save();
}


/**
 * Deletes an event
 * @param req {Object} express request
 * @param {number} id The id of the user to delete
 */
async function _delete(req, id) {
    // await Event.findByIdAndRemove(id);
    let event = await Event.findById(id);

    // await User.findByIdAndRemove(id);
    Event.findByIdAndRemove(id)
        .then(function(event){
            console.log("Deleted event with id: " + event._id);
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "event",
                    actionType: "delete",
                    actionDetail: "eventDelete",
                    key: event.id,
                    value: event.title.value,
                    tag: "<DELETE>"
                },
                authorizedUser: req.user,
                target: {
                    targetType: "event",
                    targetObject: event._id,
                    targetObjectId: event._id,
                    targetModel: "Event",
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

/**
 *
 * @param req {Object} request object
 * @param event {Event} event object
 * @param filename {String} filename
 * @param filetype {String} file extension. Supported: [jpg, png, bmp, gif, pdf, txt]
 * @param size {Number} file size in bytes
 * @param args {Object} {}
 * @returns {Promise<*>}
 */
async function addFileReference(req, event, filename, filetype, size, args) {

    // validate

    if (!event) throw new Error('Event not found');
    if (!(event instanceof Event)) {
        // yes, it's a mongoose Cat model object
        console.log("Failed to validate event object. Aborting")
        throw new Error("invalid parameters given")
    }

    // validate input
    if (!filename) throw new Error('no key given');
    if (!filetype) {
        filetype = "unset";
    }


    let key = event.files;
    let value = {
        filename: filename,
        filetype: filetype,
        size: size
    }

    // check if filename already exists
    try {
        //check if array
        var index = event.files.map(e => e.filename).indexOf(filename);
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
        // filename already taken
        console.log("filename " + filename + " exists for event "+ event.title.value + ": overwriting file. Is this intended?");
        event.files[index] = value;
    }
    else {
        event.files.push(value);
    }
    return event.save()
        .then(function(event){

            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "event",
                    actionType: "modify",
                    actionDetail: "eventAddFile",
                    key: "files",
                    fullKey: "event.files",
                    value:  filename,
                },
                authorizedUser: req.user,
                target: {
                    targetType: "event",
                    targetObject: event._id,
                    targetObjectId: event._id,
                    targetModel: "Event",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
            LogService.create(log).then().catch();
        })
        .catch();
}

/**
 *
 * @param req {Object} request object
 * @param event {Event} event object
 * @param filename {String} filename
 * @param args {Object} {}
 * @returns {Promise<*>}
 */
async function removeFileReference(req, event, filename, args) {

    // validate

    if (!event) throw new Error('Event not found');
    if (!(event instanceof Event)) {
        console.log("Failed to validate event object. Aborting")
        throw new Error("invalid parameters given")
    }

    // validate input
    if (!filename) throw new Error('no key given');

    let key = event.files;
    let value = {
        filename: filename,
    }

    try {
        //check if in array
        var index = event.files.map(e => e.filename).indexOf(filename);

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

    if (index <= -1) {
        // file not found
        let msg = "Failed to remove file: filename " + filename + " not found for event "+ event.title.value;
        console.error(msg);
        throw new Error(msg);
    }

    if (index > -1) {
        // file found
        event.files.splice(index, 1);
    }

    return event.save()
        .then( event => {
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "event",
                    actionType: "modify",
                    actionDetail: "eventRemoveFile",
                    key: "files",
                    fullKey: "event.files",
                    value:  filename,
                },
                authorizedUser: req.user,
                target: {
                    targetType: "event",
                    targetObject: event._id,
                    targetObjectId: event._id,
                    targetModel: "Event",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
            LogService.create(log).then().catch();
        })
}


async function addEventAdmin(req, event, user, operationsArray) {
    return UserService.addIndividualEventAccess(req, user.id, event.id, operationsArray)
}

async function removeEventAdmin(req, event, user) {
    return UserService.removeIndividualEventAccess(req, user.id, event.id)
}
