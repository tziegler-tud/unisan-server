import bcrypt from 'bcrypt';
import db from '../schemes/mongo.js';
import AuthService from './authService.js';
import LogService from "./logService.js";
import aclService from "./aclService.js";
import UserService from "./userService.js";
import Log from '../utils/log.js';


const Event = db.Event;
const User = db.User;
const Qualifications = db.Qualifications;

import fs from 'fs-extra';
import {convertValueToDelta} from "../utils/QuillHelper.js";

export default {
    getAll,
    getAllFiltered,
    getUpcoming,
    getById,
    create,
    update,
    updateKey,
    updateTitle,
    updateDescription,
    matchAny,
    populateParticipants,
    addParticipant,
    removeParticipant,
    enablePostings,
    addPosting,
    updatePosting,
    removePosting,
    assignPost,
    unassignPost,
    delete: _delete,

    getUserEvents,
    getUserPostings,
    addFileReference,
    removeFileReference,

    checkUserForAssignment,

    devUpdateDocuments,
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
        sort: undefined,
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
 * @param args.dateFilter.minDate {Date} start of Date range to filter for. Defaults to current Date
 * @param args.dateFilter.maxDate {Date} end of Date range to filter for. Defaults to current Date
 * @param args.dateFilter.selector {String} String denoting how to filter. Accepts: ["match", "gte", "lte", "range", "all"].
 * @returns {Promise<Query|*|number>}
 */
async function matchAny(matchString, args){
    const dateFilterPropertyName = "date.endDate";
    //matches a given string username, firstname and lastname, and optionally filters by date
    let eventlist;
    let dateFilter = {};
    let universalFilter = {};
    let universalFilterArray = [];

    if (args.filter===undefined) {

    }
    else {
        if (Array.isArray(args.filter)) {
            args.filter.forEach(filter => {
                if (filter.filter === undefined || filter.value === undefined) {

                } else {
                    let filterObj = {};
                    filterObj[filter.filter] = filter.value;
                    universalFilterArray.push(filterObj);
                }
            })
        } else if (args.filter.filter === undefined || args.filter.value === undefined) {
            let filterObj = {};
            filterObj[args.filter.filter] = args.filter.value;
            universalFilterArray = [filterObj]
        }
    }
    if (args.dateFilter === undefined) args.dateFilter = {}
    if(args.dateFilter.selector === undefined || typeof(args.dateFilter.selector) !== "string" || args.dateFilter.selector === "all") {
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
            dateFilter = {};
            dateFilter[dateFilterPropertyName] = innerFilter;
        }
    }

    //if filter is empty, return all results

    eventlist = Event.find();

    if(dateFilter[dateFilterPropertyName]) {
        eventlist.and([dateFilter])
    }
    if (matchString.length !== 0) {
        //filter user by given string, using title and type

        eventlist = eventlist.and([dateFilter, {'title.value': { $regex: matchString, $options: "-i" }}]); //dont filter for type
    }

    if(universalFilterArray.length > 0)
        eventlist = eventlist.and(universalFilterArray);
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
            eventParam.title.delta = convertValueToDelta(eventParam.title.value);
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
    return new Promise(function(resolve, reject){
        event.save()
            .then(event => {
                resolve(event);
                LogService.create(log)
                    .then(
                    )
                    .catch(

                    );
                fs.ensureDir(appRoot + '/src/data/uploads/event_images/' + event._id.toString(), { recursive: true }, (err) => {
                    if (err) {
                        console.warn("Failed to create directory: " + '/src/data/uploads/event_images/' + event._id.toString());
                    }
                    else {
                        fs.copyFile(appRoot + '/src/data/event_images/dummy.jpg', appRoot + '/src/data/uploads/event_images/'+ event._id + '/' + event._id + '.jpg', (err) => {
                            if (err)  {
                                console.warn("Failed to copy dummy image to event.");
                            }
                            else {

                            }
                        });
                    }
                });
                fs.ensureDir(appRoot + '/src/data/uploads/event_files/' + event._id.toString(), { recursive: true }, (err) => {
                    if (err) {
                        throw err;
                    } else {
                    }
                });
            })
            .catch(err => {
                console.error("Error while creating event: " + err);
                throw new Error(err)
            });
    })
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

    //check if date was modified and adjust postings accordingly
    if (eventParam.date !== undefined) {
        if (eventParam.startDate !== undefined) {
            event.postings.forEach(posting => {
                posting.date.startDate.setUTCFullYear(event.date.startDate.getUTCFullYear());
                posting.date.startDate.setUTCMonth(event.date.startDate.getUTCMonth());
                posting.date.startDate.setUTCDate(event.date.startDate.getUTCDate());
                posting.date.endDate.setUTCFullYear(event.date.endDate.getUTCFullYear());
                posting.date.endDate.setUTCMonth(event.date.endDate.getUTCMonth());
                posting.date.endDate.setUTCDate(event.date.endDate.getUTCDate());
            })
        }
    }

    return new Promise(function(resolve, reject){
        event.save()
            .then(result=> {
                resolve(result);
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

            })
            .catch(err=> reject(err))
    })

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
            //check if date was modified and adjust postings accordingly
            if (key === "date" || key === "date.startDate") {
                event.postings.forEach(posting => {
                    posting.date.startDate.setUTCFullYear(event.date.startDate.getUTCFullYear());
                    posting.date.startDate.setUTCMonth(event.date.startDate.getUTCMonth());
                    posting.date.startDate.setUTCDate(event.date.startDate.getUTCDate());
                    posting.date.endDate.setUTCFullYear(event.date.endDate.getUTCFullYear());
                    posting.date.endDate.setUTCMonth(event.date.endDate.getUTCMonth());
                    posting.date.endDate.setUTCDate(event.date.endDate.getUTCDate());
                })
                event.markModified("postings");
            }
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

async function updateTitle(req, id, title) {
    const event = await Event.findById(id);
    // validate
    if (!event) throw new Error('Event not found');

    // validate input
    if (!title) throw new Error('no value given');
    let ojVal = event.title.value;


    let newTitle = Object.assign(event.title, title)
    let newVal = newTitle.value;
    let logKey = "title"
    let key = "title";

    return new Promise(function(resolve, reject){
        event.set("title", newTitle, {strict: false} );
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


async function updateDescription(req, id, descriptionObject) {
    const event = await Event.findById(id);
    // validate
    if (!event) throw new Error('Event not found');
    // validate input
    if (!descriptionObject) throw new Error('no value given');
    let ojVal = event.description.longDesc.value ? event.description.longDesc.value : event.description.shortDesc.value;
    let newDescription = Object.assign(event.description, descriptionObject)
    let newVal = newDescription.longDesc.value ? newDescription.longDesc.value : newDescription.shortDesc.value;
    let logKey = "description";
    let key = "description";

    return new Promise(function(resolve, reject){
        event.set("description", newDescription, {strict: false});
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
    }).populate({
        path: 'postings.assigned.user',
        select: 'generalData username',
    }).populate({
        path: 'postings.requiredQualifications',
    })
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
    let roles = ["admin", "lecturer", "participant"];
    let rolesDefault = "participant";

    if (args === undefined) args = {}
    let defaults = {
        role: rolesDefault,
        overwrite: false,
    };

    args = Object.assign(defaults, args);
    const event = await Event.findById(id);
    const user = await User.findById(userId).select("username");

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
            return true;
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
                type: "activity",
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
            type: "activity",
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
            type: "activity",
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
                    originalValue: event.title.value,
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
                type: "activity",
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

/**
 * @typedef {Object} Qualification
 * @property {String} qualType
 * @property {String} name
 */

/**
 *
 * @param req
 * @param eventId
 * @param value {Boolean} [true] - true to enable, false to disable
 * @returns {Promise<void>}
 */
async function enablePostings(req, eventId, value){
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');
    if(value === undefined) value = true;

    event.hasPostings = value;
    return event.save();
}

/**
 *
 * @param req
 * @param eventId {String} event id
 * @param posting {Object} posting Object
 * @param posting.requiredQualifications {Qualification[]} array of qualification objects
 * @param posting.assigned {Object} holds information on assigned user
 * @param posting.assigned.isAssigned {Boolean} true if the posting has an assigned user
 * @param posting.assigned.user {String} user id of assigned user. requires isAssigned to be set in order to take effect.
 * @param posting.assigned.qualification {Object} qualification associated with assigned user. requires isAssigned to be set in order to take effect.
 * @param posting.enabled {Boolean} true if the posting is enabled, i.e. user can register for this post
 * @param args {Object} args
 * @returns {Promise <void>}
 */
async function addPosting (req, eventId, posting, args) {

    const errMsg = "Failed to add Posting: "
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    if(!Array.isArray(posting.requiredQualifications) || posting.requiredQualifications.length === 0) {
        posting.requiredQualifications = [];
    }

    let defaults = {
        requiredQualifications: [],
        isAssigned: false,
        description: "",
        enabled: true,
        userId: undefined,
    };

    posting = Object.assign(defaults, posting);

    //lets check if the qual refs really exist.
    let qualPromiseArray = [];
    posting.requiredQualifications.forEach(qualificationId => {
        //check if qual exists
        let qualPromise = Qualifications.findById(qualificationId);
        qualPromiseArray.push(qualPromise);
    })
    let qualArray = await Promise.all(qualPromiseArray)

    //ensure some key exists for logging
    let logQualName = "";
    qualArray.forEach((qual, index, array)=> {
        if (index === array.length - 1) logQualName = logQualName + qual.name; //last element
        else logQualName = logQualName + qual.name + ", "
    })

    let post = {
        requiredQualifications: posting.requiredQualifications,
        description: posting.description,
        assigned: {
            isAssigned: false,
        },
        date: posting.date,
        enabled: posting.enabled,
        order: posting.order,
    };

    let userAdded = false;
    if (posting.assigned.isAssigned) {
        const user = await User.findById(posting.assigned.user);
        if (user) {
            post.assigned.isAssigned = true;
            post.assigned.user = posting.assigned.user;
            post.assigned.qualification = posting.assigned.qualification;
            userAdded = true;

        }
        else {
            console.warn("parameter error: assigned user not found. creating unassigned posting...");
        }
    }
    event.postings.push(post);

    await event.populate("postings.requiredQualifications");

    event.postings = sortPostings(event.postings);

    return new Promise(function(resolve, reject) {
        //add user to participants as well
        if (userAdded) {
            //add user to participants list before continuing to avoid user occupying multiple postings.
            addParticipant(req, eventId, post.assigned.user, {})
                .then(result => {
                    saveEvent(resolve, reject)
                })
                .catch(err => {
                    reject(err)
                })
        }
        else {
            saveEvent(resolve, reject)
        }

        function saveEvent(resolve, reject){
            event.save()
                .then(result => {
                    resolve(event);
                    let log = new Log({
                        type: "activity",
                        action: {
                            objectType: "event",
                            actionType: "modify",
                            actionDetail: "eventAddPost",
                            key: logQualName,
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
                .catch(err => {
                    reject(err);
                })
        }
    })
}


/**
 *
 * @param req
 * @param eventId {String} event id
 * @param posting {Object} posting Object
 * @param posting.requiredQualifications {Qualification[]} array of qualification objects
 * @param posting.assigned {Object} holds information on assigned user
 * @param posting.assigned.isAssigned {Boolean} true if the posting has an assigned user
 * @param posting.assigned.user {String} user id of assigned user. requires isAssigned to be set in order to take effect.
 * @param posting.assigned.qualification {Object} qualification associated with assigned user. requires isAssigned to be set in order to take effect.
 * @param posting.enabled {Boolean} true if the posting is enabled, i.e. user can register for this post
 * @param args {Object} args
 * @returns {Promise <void>}
 */
async function updatePosting (req, eventId, postingData, args) {

    const errMsg = "Failed to update Posting: "
    const event = await Event.findById(eventId).populate("postings.requiredQualifications");
    if (!event) throw new Error(errMsg + 'Event not found');

    if(postingData === undefined) throw new Error(errMsg + "invalid arguments received");
    if(postingData.id === undefined) throw new Error(errMsg + "invalid arguments received");

    let postingId = postingData.id

    var qualificationsModified = false;
    var qualArray = [];

    if(postingData.requiredQualifications){
        qualificationsModified = true;
        if(!Array.isArray(postingData.requiredQualifications) || postingData.requiredQualifications.length === 0) {
            throw new Error("Invalid data received");
        }
    }
    //find posting
    let index = event.postings.findIndex(obj => obj._id.toString() === postingId);
    if(index > -1) {
        //found it!
        let posting = event.postings[index];

        let updatedPosting = Object.assign(posting, postingData);
        event.postings.splice(index, 1, updatedPosting);

        var qualPromiseArray = [];
        let logQualName = "";
        //lets check if the qual refs really exist.
        updatedPosting.requiredQualifications.forEach(qualificationId => {
            //check if qual exists
            let qualPromise = Qualifications.findById(qualificationId);
            qualPromiseArray.push(qualPromise);
        })
        await Promise.all(qualPromiseArray)
            .then(results => {
                results.forEach((qual, index, array) => {
                    if (index === array.length - 1) logQualName = logQualName + qual.name; //last element
                    else logQualName = logQualName + qual.name + ", "
                })
            })
            .catch(err => {
                logQualName = postingId;
            })

        return new Promise(function(resolve, reject){
            event.postings = sortPostings(event.postings);
            event.save()
                .then(result => {
                    resolve();
                    let log = new Log({
                        type: "activity",
                        action: {
                            objectType: "event",
                            actionType: "modify",
                            actionDetail: "eventUpdatePost",
                            key: logQualName,
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
        })
    }
    else {
        //posting not found :(
        throw new Error(errMsg + "posting not found.")
    }
}

async function removePosting (req, eventId, postingId) {
    let errMsg = "Failed to remove posting: ";
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    //find posting
    let index = event.postings.findIndex(obj => obj._id.toString() === postingId);
    return new Promise(function(resolve, reject){
        if(index > -1) {
            //found it!

            //lets check if the qual refs really exist.
            let qualPromiseArray = [];
            let posting = event.postings[index];
            posting.requiredQualifications.forEach(qualificationId => {
                //check if qual exists
                let qualPromise = Qualifications.findById(qualificationId);
                qualPromiseArray.push(qualPromise);
            })
            //ensure some key exists for logging
            let logQualName = "";
            Promise.all(qualPromiseArray)
                .then(results => {
                    results.forEach((qual, index, array)=> {
                        if (index === array.length - 1) logQualName = logQualName + qual.name; //last element
                        else logQualName = logQualName + qual.name + ", "
                    })
                })
                .catch(err => {
                    logQualName = postingId;
                })

            event.postings.splice(index, 1);
            //remove user from participants
            event.populate("postings.requiredQualifications")
                .then(()=>{
                    event.postings = sortPostings(event.postings);
                    event.save()
                        .then(result => {
                            resolve();
                            let log = new Log({
                                type: "activity",
                                action: {
                                    objectType: "event",
                                    actionType: "modify",
                                    actionDetail: "eventRemovePost",
                                    key: logQualName,
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
                })
        }
        else {
            //posting not found :(
            reject(errMsg + "Posting not found.")
        }
    });
}

/**
 *
 * @param req {Object} req object
 * @param eventId {String} event id
 * @param postingId {String} id of posting
 * @param userId {String} id of user to be assigned to this post
 * @param args {Object} additional args
 * @param args.ignoreRequiredQualification {boolean} [false] true to allow a user to be assigned that does not match required qualifications
 * @param args.overwrite {boolean} [false] true to overwrite if posting already has assigned user
 * @param args.allowMultiple {boolean} [false] true to allow assignment if user already has another post overlapping times
 * @returns {Promise<unknown>}
 */
async function assignPost (req, eventId, postingId, userId, args) {
    //assigns a user to an empty post
    let errMsg = "Failed to assign user to post: "
    const event = await Event.findById(eventId);
    if (!event) throw new Error(errMsg + 'Event not found');
    //populate postings
    event.populate("postings.requiredQualifications");

    const user = await UserService.getById(userId);
    if(!user) throw new Error(errMsg + "User not found.");

    if (args === undefined) args = {};
    let defaultArgs = {
        overwrite: false,
        ignoreRequiredQualification: false,
        allowMultiple: false,
    }

    args = Object.assign(defaultArgs, args)

    //find posting
    let index = event.postings.findIndex(obj => obj.id.toString() === postingId);

    if(index > -1) {
        //found it!
        let post = event.postings[index];

        let userMatchesRequirement = false
        let userQualification = {};
        let qualification = {};
        //check if user matches qualification requirement
        let matchingQualifications = getMatchingQualifications(user, post);
        if (matchingQualifications.length > 0) {
            userMatchesRequirement = true;
            userQualification = matchingQualifications[0];
            qualification = userQualification.qualification;

        }

        if(!userMatchesRequirement) {
            console.warn("Trying to assign user to post, but user does not have matching qualification. Checking for overwrite...")
            if (args.ignoreRequiredQualification) {

            }
            else {
                throw new Error("User does not match required qualifications.")
            }
        }


        let assigned = {
            user: userId,
            isAssigned: true,
            date: Date.now(),
        }


        //find all upcoming postings of target user
        let userPostings = await getUserPostings(userId, {
            selector: "gte",
        })

        //check for overlap
        let overLap = findOverlap(userPostings, post);

        if(overLap !== undefined) {
            //overlapping posting found!
            if (!args.allowMultiple) {
                console.log("Rejected user "+ user.username + " to be assigned to post: User is already assigned to a different post.")
                throw new Error("User already assigned for a different post.");
            }

        }

        //check if taken
        if(post.assigned.isAssigned) {
            //already taken. overwrite?
            console.log("Post has already an user assigned. Checking for overwrite...");
            if(args.overwrite) {
                console.log("overwriting assignment...")
                post.assigned = assigned;
            }
            else {
                throw new Error("Post is already assigned to a different user.");
                return;
            }

        }
        else {
            post.assigned = assigned;
        }
        let updatedEvent = addParticipant(event, user._id, {
            overwrite: false,
        })
        return new Promise(function(resolve, reject){
            console.log("user "+ user.username + " assigned to post.")
            updatedEvent.save()
                .then(result => {
                    let log = new Log({
                        type: "activity",
                        action: {
                            objectType: "event",
                            actionType: "modify",
                            actionDetail: "eventAssignPost",
                            key: user.username,
                            value: qualification.name,
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
                    resolve();
                })
                .catch(err => {
                    reject(err);
                })
        })
    }
    else {
        //posting not found :(
            reject(new Error("Posting not found."))
    }

    function addParticipant(event, userId, args){
        if (args === undefined) args = {};
        let defaults = {
            role: "assigned",
            user: userId,
            overwrite: false,
        }
        args = Object.assign(defaults, args);

        let data = {
            user: userId,
            role: args.role,
        }

        //check if user is registered
        var index = event.participants.map(e => e.user.toString()).indexOf(userId.toString());
        if (index > -1) {
            // user already registered.
            if(!args.overwrite){
                //abort
                console.log("user " + userId + " already registered for Event "+ event.title.value);
                return event;
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
        return event;
    }
}

async function unassignPost (req, eventId, userId, postingId) {
//assigns a user to an empty post
    let errMsg = "Failed to unassign user from post: "
    const event = await Event.findById(eventId);
    if (!event) throw new Error(errMsg + 'Event not found');
    //populate postings
    event.populate("postings.requiredQualifications");

    const user = await User.findById(userId);
    if(!user) throw new Error(errMsg + "User not found.");

    var ojQual = {
        name: "undefined",
        qualType: "undefined",
    };

    //find posting
    let index = event.postings.findIndex(obj => obj.id.toString() === postingId);
    if(index > -1) {
        //found it!
        let post = event.postings[index];
        //check if taken
        if (post.assigned.isAssigned) {
            //found it!
            //check if expected user matches
            if (post.assigned.user.toString() !== userId) {
                console.warn(errMsg + "User does not match!");
                reject();
            }
            //all good, lets go
            if (Array.isArray(post.requiredQualifications) && post.requiredQualifications.length > 0) {
                ojQual = post.requiredQualifications[0];
            } else ojQual = postingId;
            post.assigned.qualification = {}
            post.assigned.user = undefined;
            post.assigned.isAssigned = false;
            console.log("user " + user.username + "unassigned from post.");
        } else {
            if (post.assigned.user !== undefined) {
                post.assigned.user = undefined;
            } else {
                console.warn(errMsg + "No assigned user found.")
                reject();
            }
        }
        let updatedEvent = removeParticipant(event, userId);
        return new Promise(function (resolve, reject) {
            updatedEvent.save()
                .then(result => {
                    let log = new Log({
                        type: "activity",
                        action: {
                            objectType: "event",
                            actionType: "modify",
                            actionDetail: "eventUnassignPost",
                            key: user.username,
                            value: ojQual.name,
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
                    resolve();
                })
                .catch(err => reject(err))
        });
    }
    else {
        //posting not found :(
        console.warn(errMsg + "Post not found.")
        throw new Error(errMsg + " Post not found.")
    }

    function removeParticipant(event, userId, args){
        if (args === undefined) args = {};
        let defaults = {
            role: "assigned",
            user: userId,
            overwrite: false,
        }
        args = Object.assign(defaults, args);

        let data = {
            user: userId,
            role: args.role,
        }

        //check if user is registered
        var index = event.participants.findIndex(e => {
            return (e.user.toString() === userId && e.role === args.role)
        });
        if (index > -1) {
            //remove user
            event.participants.splice(index, 1);
        }
        else {
            //user not found
            console.warn("Failed to remove participant due to unassignment: Participant not found.")
        }
        return event;
    }
}


/**
 * returns all events the user is registered for
 * @param userId {string}
 * @param args {Object}
 * @param args.sort {Object} mongoose sort object - can be a simple string to sort for a property, or an object according to docs
 * @param args.dateFilter {Object} Object to set date filtering
 * @param args.dateFilter.date {Date} start of Date range to filter for. Default to current Date
 * @param args.dateFilter.minDate {Date} end of Date range to filter for. Defaults to current Date
 * @param args.dateFilter.maxDate {Date} end of Date range to filter for. Defaults to current Date
 * @param args.dateFilter.selector {String} String denoting how to filter. Accepts: ["match", "gte", "lte", "range"].
 * @returns {Promise<Event[]>}
 */
async function getUserEvents(userId, args) {
    if (args === undefined) args = {};

    let user = await User.findById(userId).select('-hash');
    // validate
    if (!user) throw new Error('User not found');

    return matchAny("", {
        sort: args.sort,
        dateFilter: args.dateFilter,
        filter: {
            filter: "participants.user",
            value: user.id,
        }
    });
}

/**
 * returns all postings the current user is assigned to
 * @param userId
 * @param args
 * @param args.dateFilter {Object} Object to set date filtering
 * @param args.dateFilter.date {Date} start of Date range to filter for. Default to current Date
 * @param args.dateFilter.minDate {Date} end of Date range to filter for. Defaults to current Date
 * @param args.dateFilter.maxDate {Date} end of Date range to filter for. Defaults to current Date
 * @param args.dateFilter.selector {String} String denoting how to filter. Accepts: ["match", "gte", "lte", "range"].
 * @returns {Promise<Posting[]>}
 */
async function getUserPostings(userId, args) {
    if (args === undefined) args = {};
    //get all user Events
    let userEvents = await getUserEvents(userId, args);
    //extract postings
    let filteredEvents = userEvents.filter(event => {
        return (Array.isArray(event.postings) && event.postings.length > 0);
    })
    let userPostings = [];
    filteredEvents.forEach(event => {
        event.postings.forEach(posting => {
            if (posting.assigned.isAssigned) {
                let postUserId = (posting.assigned.user.username === undefined) ? posting.assigned.user : posting.assigned.user.id;
                if(postUserId.toString() === userId.toString()){
                    let eventAttr = {
                        id: event.id,
                        title: event.title,
                    };

                    let json = posting.toJSON();
                    json.event = eventAttr;
                    userPostings.push(json);
                }
            }
        })
    })
    return userPostings;
}

async function checkUserForAssignment(userId, eventId, postingId, args) {
    let errMsg = "Failed to check if user is allowed: "
    if (args === undefined) args = {};
    let defaultArgs = {

    }
    args = Object.assign(defaultArgs, args)

    const user = await UserService.getById(userId);
    if(!user) throw new Error(errMsg + "User not found.");

    const event = await Event.findById(eventId);
    if (!event) throw new Error(errMsg + 'Event not found');
    //populate postings
    event.populate("postings.requiredQualifications");

    //get all user Events
    let userPostings = await getUserPostings(userId, args);

    let index = event.postings.findIndex(obj => obj.id.toString() === postingId);

    let result = {
        allowed: false,
        matchesQualification: false,
        hasOverlap: undefined,
        overlap: undefined,
    }

    if(index > -1) {
        //found it!
        let post = event.postings[index];
        let userMatchesRequirement = false
        //check if user matches qualification requirement
        let matchingQualifications = getMatchingQualifications(user, post);
        if (matchingQualifications.length > 0) {
            userMatchesRequirement = true;
        }
        //find all upcoming postings of target user
        let userPostings = await getUserPostings(userId, {
            selector: "gte",
        })

        //check for overlap
        let overLap = findOverlap(userPostings, post);

        if (overLap !== undefined || !userMatchesRequirement) {
            //user rejected
            result.allowed = false;
            result.matchesQualification = userMatchesRequirement;
            result.hasOverlap = (overLap !== undefined);
            result.overlap = overLap;
            return result;
        }
        else {
            //user allowed
            result.allowed = true;
            result.matchesQualification = userMatchesRequirement;
            result.hasOverlap = true;
            result.overlap = overLap;
            return result;
        }
    }
    else {
        throw new Error(errMsg + " posting not found.")
    }

}

async function devUpdateDocuments() {
    let events = await Event.find();
    for (let event of events) {
        await event.save();
    }
    return events;
}



/**
 * helpers
 */

function findOverlap(userPostings, posting){
    let overlap = userPostings.find(userPosting => {
        if (userPosting.date.startDate < posting.date.startDate) { // a starts before b
            if(userPosting.date.endDate > posting.date.startDate) { //a ends after b starts.
                return true;
            }
        }
        if (posting.date.startDate < userPosting.date.startDate) { // b starts before a
            if(posting.date.endDate > userPosting.date.startDate) { //b ends after a starts.
                return true;
            }
        }
        if (posting.date.startDate === userPosting.date.startDate) { // b starts together with a
            return true;
        }
        else return false;
    })
    return overlap;
}

/**
 * returns an array of qualifications with which the user can fill a posting
 * @param user {User} user object
 * @param posting {Posting} posting object
 * @returns {Qualification[]}
 */
var getMatchingQualifications = function(user, posting) {
    //determine if user is allowed to assign himself to this post
    let userIsAllowed = false;
    let matchingQualifications = [];
    //find user qualification that match type and minimum level
    posting.requiredQualifications.forEach(requiredQualification => {
        let minimumLevel = requiredQualification.level;
        user.qualifications.forEach(userQualification => {
            if (userQualification.qualification.qualType === requiredQualification.qualType && userQualification.qualification.level >= requiredQualification.level) {
                matchingQualifications.push(userQualification);
            }
        })
    });
    //matchingQualifications contain all user qualifications that can be used. let the user choose which one to use?
    return matchingQualifications;
}

var sortPostings = function(postingsArray) {

    let sortedList = postingsArray.sort(function(a,b){
        try {
            let aMap = a.requiredQualifications.map(qual => {
                return qual.index;
            })
            let bMap = b.requiredQualifications.map(qual => {
                return qual.index;
            })
            let aScore = Math.min(aMap);
            let bScore = Math.min(bMap);
            let sort = aScore-bScore;
            if (sort === 0){
                let aLevel = Math.min(a.requiredQualifications.map(qual => {
                    return qual.level;
                }))
                let bLevel = Math.min(b.requiredQualifications.map(qual => {
                    return qual.level;
                }))
                return bLevel - aLevel;
            }
            else return sort;
        }
        catch(e){
            return 0;
        }
    })
    return sortedList;
}