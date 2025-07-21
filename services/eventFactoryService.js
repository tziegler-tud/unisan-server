import bcrypt from 'bcryptjs';
import db from '../schemes/mongo.js';
import AuthService from './authService.js';
import LogService from "./logService.js";
import aclService from "./aclService.js";
import EventService from "./eventService.js"
import UserService from "./userService.js";
import Log from '../utils/log.js';


const Event = db.Event;
const EventBlueprint = db.EventBlueprint
const User = db.User;
const Qualifications = db.Qualifications;

import fs from 'fs-extra';
import {convertValueToDelta} from "../utils/QuillHelper.js";
import {extractTimeRangeString} from "../schemes/utils.js";

export default {
    getAll,
    getAllFiltered,
    getById,
    create,
    update,
    updateTitle,
    updateTime,
    updateLocation,
    updateDescription,
    enablePostings,
    addPosting,
    updatePosting,
    removePosting,
    delete: _delete,
    devUpdateDocuments,
};

/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */
/** @typedef {import("../schemes/eventScheme.js").EventScheme} EventScheme */


/**
 * @typedef {Object} EventBlueprintApiParams
 * @property {Object} title
 * @property {string} title.value
 * @property {Object} [title.delta]
 * @property {string} [title.html]
 *
 * @property {string} type
 *
 * @property {Object} description
 * @property {Object} description.shortDescription
 * @property {string} [description.shortDescription.title="Kurzbeschreibung"]
 * @property {string} [description.shortDescription.value]
 * @property {Object} [description.shortDescription.delta]
 * @property {Object} description.longDescription
 * @property {string} [description.longDescription.title="Beschreibung"]
 * @property {string} [description.longDescription.value]
 * @property {Object} [description.longDescription.delta]
 *
 * @property {Object} date
 * @property {number} [date.startDate]
 * @property {number} [date.endDate]
 *
 * @property {string} location
 */

/**
 * @typedef {Object} EventBlueprintObject
 * @property {Object} title
 * @property {string} title.title
 * @property {string} title.value
 * @property {Object} [title.delta]
 * @property {string} [title.html]
 *
 * @property {string} type
 *
 * @property {Object} description
 * @property {Object} description.shortDesc
 * @property {string} [description.shortDesc.title="Kurzbeschreibung"]
 * @property {string} [description.shortDesc.value]
 * @property {Object} [description.shortDesc.delta]
 * @property {string} [description.shortDesc.html]
 * @property {Object} description.longDesc
 * @property {string} [description.longDesc.title="Beschreibung"]
 * @property {string} [description.longDesc.value]
 * @property {Object} [description.longDesc.delta]
 * @property {string} [description.longDesc.html]
 *
 * @property {Object} date
 * @property {Date} [date.startDate]
 * @property {Date} [date.endDate]
 *
 * @property {Object} location
 * @property {string} [location.title="Adresse"]
 * @property {string} [location.value]
 *
 * @property {boolean} [hasPostings=false]
 *
 * @property {Array<Object>} postings
 * @property {Array<string>} postings[].requiredQualifications - ObjectId strings referencing 'Qualifications'
 * @property {string} [postings[].description]
 * @property {boolean} [postings[].allowHigher=true]
 * @property {Object} postings[].date
 * @property {Date} [postings[].date.startDate]
 * @property {Date} [postings[].date.endDate]
 * @property {boolean} [postings[].enabled=true]
 * @property {boolean} [postings[].optional=false]
 *
 * @property {Date} [createdDate]
 */


/**
 * Gets all events
 */
async function getAll() {
    return EventBlueprint.find();
}


/**
 *
 * @param {string} matchString string for filtering
 * @returns {Promise<[Event]>}
 */
async function getAllFiltered(matchString = ""){
    let query = EventBlueprint.find();
    if (matchString.length !== 0) {
        //filter objects by given string, using title and type
        query = query.or([
            {
                'title.value': { $regex: matchString, $options: "i" },
            },
            {
                'description.shortDesc.value': { $regex: matchString, $options: "i" }
            },
            {
                'description.longDesc.value': { $regex: matchString, $options: "i" }
            }
            ]);
    }
    return query.exec();
}

/**
 * Gets an event by its id
 * @param {number} id id of the event
 * @param {boolean} populate set true to populate qualification array. Default: false
 */
async function getById(id, populate=false) {
    if(populate) {
        return EventBlueprint.findById(id).populate({
            path: 'postings.requiredQualifications',
        })
    }
    else return EventBlueprint.findById(id);
}


/**
 *   Creates a new EventBlueprint
 * @param req {Object} express request
 * @param apiParams {EventBlueprintApiParams}
 * @returns {Promise<unknown>}
 */
async function create(req,
                      apiParams) {

    let title = apiParams.title ?? {};
    let titleValue = title.value;
    let description = apiParams.description ?? {};
    let location = apiParams.location ?? "";
    let type = apiParams.type ?? "";
    let date = apiParams.date ?? {};

    /**
     * @type {Date}
     */
    let startDate;
    /**
     * @type {Date}
     */
    let endDate;

    if(!title){
        console.warn("Trying to create event with no title. Setting default...");
        titleValue = "Neue Eventvorlage";
    }

    //has Description?
    if(!description.shortDescription){
        description.shortDescription = {
            value: "Keine Beschreibung verfügbar",
        }
    }
    if(!description.longDescription){
        description.longDescription = {
            value: "keine Beschreibung verfügbar."
        }
    }

    //has date?
    if(!date.startDate) {
        startDate = undefined;
    }
    else {
        startDate = new Date(date.startDate)
    }

    if(!date.endDate) {
        endDate = undefined;
    }
    else {
        endDate = new Date(date.endDate)
    }

    const event = new EventBlueprint({
        title:  {
            value: titleValue,
            delta: title.delta ? title.delta : convertValueToDelta(titleValue),
        },
        description: {
            longDesc: description.longDescription,
            shortDesc: description.shortDescription
        },
        location: {
            value: location
        },
        type: {
            value: type
        },
        date: {
            startDate: startDate,
            endDate: endDate,
        }
    });

    //create log
    let log = new Log({
        type: "modification",
        action: {
            objectType: "eventBlueprint",
            actionType: "create",
            actionDetail: "eventBlueprintCreate",
            key: event.id,
            value: event.title.value,
        },
        authorizedUser: req.user,
        target: {
            targetType: "eventBlueprint",
            targetObject: event._id,
            targetObjectId: event._id,
            targetModel: "EventBlueprint",
        },
        httpRequest: {
            method: req.method,
            url: req.originalUrl,
        }
    })

    // save event
    return new Promise(function(resolve, reject){
        const imageDir = "/src/data/uploads/blueprint_images/"
        event.save()
            .then(event => {
                resolve(event);
                LogService.create(log)
                    .then(
                    )
                    .catch(

                    );
                fs.ensureDir(appRoot + imageDir + event._id.toString(), { recursive: true }, (err) => {
                    if (err) {
                        console.warn("Failed to create directory: " + imageDir + event._id.toString());
                    }
                    else {
                        fs.copyFile(appRoot + '/src/data/internal/dummy.jpg', appRoot + imageDir + event._id + '/' + event._id + '.jpg', (err) => {
                            if (err)  {
                                console.warn("Failed to copy dummy image to event.");
                            }
                            else {

                            }
                        });
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
 * Updates an existing eventBlueprint
 *
 * @param req {Object} express request
 * @param {number} id The id of the existing event
 * @param {EventBlueprintApiParams} eventParam The object to save as event
 */
async function update(req, id, eventParam) {
    /**
     * @type {EventBlueprintObject}
     */
    const event = await EventBlueprint.findById(id);

    // validate
    if (!event) throw new Error('Event not found');

    // copy eventParam to event
    Object.assign(event, eventParam);

    //check if date was modified and adjust postings accordingly
    if (eventParam.date !== undefined && eventParam.date.startDate !== undefined) {
        event.postings.forEach(posting => {
            posting.date.startDate.setUTCFullYear(event.date.startDate.getUTCFullYear());
            posting.date.startDate.setUTCMonth(event.date.startDate.getUTCMonth());
            posting.date.startDate.setUTCDate(event.date.startDate.getUTCDate());
            posting.date.endDate.setUTCFullYear(event.date.endDate.getUTCFullYear());
            posting.date.endDate.setUTCMonth(event.date.endDate.getUTCMonth());
            posting.date.endDate.setUTCDate(event.date.endDate.getUTCDate());
        })
    }

    return new Promise(function(resolve, reject){
        event.save()
            .then(result=> {
                resolve(result);
                let log = new Log({
                    type: "modification",
                    action: {
                        objectType: "eventBlueprint",
                        actionType: "modify",
                        actionDetail: "eventBlueprintModify",
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
                        targetModel: "EventBlueprint",
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
 * @param id {Number} mongoose id
 * @param title {Object}
 * @param title.value {string} raw title
 * @param title.delta {Object} delta object
 * @returns {Promise<unknown>}
 */
async function updateTitle(req, id, title) {
    const errMsg = "Failed to update EventBlueprint title"
    /**
     * @type {EventBlueprintObject}
     */
    const event = await EventBlueprint.findById(id);
    // validate
    if (!event) throw new Error(errMsg + ': EventBlueprint not found');

    // validate input
    if (!title) throw new Error(errMsg + 'Invalid arguments received.');

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
                        objectType: "eventBlueprint",
                        actionType: "modify",
                        actionDetail: "eventBlueprintModify",
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


/**
 *
 * @param {Object} req express request
 * @param {number} id mongoose id
 * @param {Date} startTime start Time in Date format
 * @param {Date} endTime end Time in Date format
 * @returns {Promise<void>}
 */
async function updateTime(req, id, startTime, endTime){
    const errMsg = "Failed to update EventBlueprint time"
    /**
     * @type {EventBlueprintObject}
     */
    const event = await EventBlueprint.findById(id);
    if (!event) throw new Error(errMsg + ': Event not found');
    // validate input
    if (!startTime && !endTime) throw new Error(errMsg + ': Invalid arguments received.');

    const ojValue = extractTimeRangeString(event.date.startDate, event.date.endDate)

    if(startTime) {
        event.date.startDate = new Date(startTime);
    }
    if(endTime) {
        event.date.endDate = new Date(endTime);
    }

    const newValue = extractTimeRangeString(event.date.startDate, event.date.endDate)

    await event.save()

    let log = new Log({
        type: "modification",
        action: {
            objectType: "eventBlueprint",
            actionType: "modify",
            actionDetail: "eventBlueprintModify",
            key: "date",
            fullKey: "date",
            originalValue: ojValue,
            value:  newValue,
        },
        authorizedUser: req.user,
        target: {
            targetType: "eventBlueprint",
            targetObject: event._id,
            targetObjectId: event._id,
            targetModel: "EventBlueprint",
        },
        httpRequest: {
            method: req.method,
            url: req.originalUrl,
        }
    })
    LogService.create(log).then().catch();
    return event;

}

async function updateLocation(req, id, location) {

    const errMsg = "Failed to update EventBlueprint description"
    /**
     * @type {EventBlueprintObject}
     */
    const event = await EventBlueprint.findById(id);
    // validate
    if (!event) throw new Error(errMsg + ': Event not found');
    // validate input
    if (!location) throw new Error(errMsg + ': Invalid arguments received.');


    let ojVal = event.location;
    let newVal = location
    let logKey = "location";
    let key = "location";

    return new Promise(function(resolve, reject){
        event.location = location;
        event.save()
            .then(event => {
                // create log
                resolve(event);
                let log = new Log({
                    type: "modification",
                    action: {
                        objectType: "eventBlueprint",
                        actionType: "modify",
                        actionDetail: "eventBlueprintModify",
                        key: logKey,
                        fullKey: key,
                        originalValue: ojVal,
                        value:  newVal,
                    },
                    authorizedUser: req.user,
                    target: {
                        targetType: "eventBlueprint",
                        targetObject: event._id,
                        targetObjectId: event._id,
                        targetModel: "EventBlueprint",
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
    const errMsg = "Failed to update EventBlueprint description"
    /**
     * @type {EventBlueprintObject}
     */
    const event = await EventBlueprint.findById(id);
    // validate
    if (!event) throw new Error(errMsg + ': Event not found');
    // validate input
    if (!descriptionObject) throw new Error(errMsg + ': Invalid arguments received.');


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
                        objectType: "eventBlueprint",
                        actionType: "modify",
                        actionDetail: "eventBlueprintModify",
                        key: logKey,
                        fullKey: key,
                        originalValue: ojVal,
                        value:  newVal,
                    },
                    authorizedUser: req.user,
                    target: {
                        targetType: "eventBlueprint",
                        targetObject: event._id,
                        targetObjectId: event._id,
                        targetModel: "EventBlueprint",
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

/**
 * Deletes an eventBlueprint
 * @param req {Object} express request
 * @param {number} id The id to delete
 */
async function _delete(req, id) {

    // await User.findByIdAndRemove(id);
    EventBlueprint.findByIdAndRemove(id)
        .then(function(event){
            console.log("Deleted EventBlueprint with ID: " + event._id);
            //create log
            let log = new Log({
                type: "modification",
                action: {
                    objectType: "eventBlueprint",
                    actionType: "delete",
                    actionDetail: "eventBlueprintDelete",
                    key: event.id,
                    value: event.title.value,
                    originalValue: event.title.value,
                    tag: "<DELETE>"
                },
                authorizedUser: req.user,
                target: {
                    targetType: "eventBlueprint",
                    targetObject: event._id,
                    targetObjectId: event._id,
                    targetModel: "EventBlueprint",
                },
                httpRequest: {
                    method: req.method,
                    url: req.originalUrl,
                }
            })
            LogService.create(log)
                .then()
                .catch()
            return true;
        })
        .catch()
}

/**
 *
 * @param req
 * @param eventId
 * @param value {Boolean} [true] - true to enable, false to disable
 * @returns {Promise<void>}
 */
async function enablePostings(req, eventId, value){
    const event = await EventBlueprint.findById(eventId);
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
    const event = await EventBlueprint.findById(eventId);
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

    event.postings.push(post);

    await event.populate("postings.requiredQualifications");

    event.postings = sortPostings(event.postings);

    await event.save()
    let log = new Log({
        type: "activity",
        action: {
            objectType: "eventBlueprint",
            actionType: "modify",
            actionDetail: "eventBlueprintAddPost",
            key: logQualName,
        },
        authorizedUser: req.user,
        target: {
            targetType: "eventBlueprint",
            targetObject: event._id,
            targetObjectId: event._id,
            targetModel: "EventBlueprint",
        },
        httpRequest: {
            method: req.method,
            url: req.originalUrl,
        }
    })
    LogService.create(log).then().catch();
    return event;
}


/**
 *
 * @param req
 * @param eventId {String} event id
 * @param postingData {Object} posting Object
 * @param postingData.requiredQualifications {Qualification[]} array of qualification objects
 * @param postingData.assigned {Object} holds information on assigned user
 * @param postingData.assigned.isAssigned {Boolean} true if the posting has an assigned user
 * @param postingData.assigned.user {String} user id of assigned user. requires isAssigned to be set in order to take effect.
 * @param postingData.assigned.qualification {Object} qualification associated with assigned user. requires isAssigned to be set in order to take effect.
 * @param postingData.enabled {Boolean} true if the posting is enabled, i.e. user can register for this post
 * @param args {Object} args
 * @returns {Promise <void>}
 */
async function updatePosting (req, eventId, postingData, args) {

    const errMsg = "Failed to update Posting: "
    const event = await EventBlueprint.findById(eventId).populate("postings.requiredQualifications");
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
                    resolve(event);
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
    const event = await EventBlueprint.findById(eventId);
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

async function devUpdateDocuments() {
    let events = await EventBlueprint.find();
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