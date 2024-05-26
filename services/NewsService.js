import bcrypt from 'bcrypt';
import db from '../schemes/mongo.js';
import mongoose from "mongoose";
import AuthService from './authService.js';
import Log from '../utils/log.js';
import LogService from "./logService.js";

const News = db.News;
const User = db.User;
const dbLog = db.Log;



export default {
    getAll,
    getAllByAuthor,
    getAllByTags,
    getById,
    create,
    update,
    delete: _delete,
    deleteAll: _deleteAll,
    getAllFiltered,
};

/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */
/** @typedef {import("../schemes/eventScheme.js").EventScheme} EventScheme */
/** @typedef {import("../utils/log.js").Log} Log */

/**
 * Gets all news entries
 */
async function getAll() {
    return News.find().populate({
        path: 'author',
        select: 'generalData username',
    }).sort({"timestamp": -1});
}

async function getAllByAuthor(userid) {
    return News.find({author: userid}).populate({
        path: 'author',
        select: 'generalData username',
    }).sort({"timestamp": -1});
}

async function getAllByTags(tagArray, combiner="OR") {
    let query = News.find();
    const filterArray = tagArray.map(tag => {
        return {tags: tag}
    })
    if(filterArray.length > 0){
        switch(combiner){
            case "AND":
                query = query.or(filterArray)
                break;
            case "OR":
            default:
                query = query.and(filterArray);
                break;
        }
    }
    query = query.populate({
        path: 'author',
        select: 'generalData username',
    }).sort({"timestamp": -1});
    return query;
}

/**
 * @param complexFilterObject {Object[]} array of universal mongodb filters object to be applied to query
 * @param args {Object}
 * @param args.sort {Object} mongoose sort object - can be a simple string to sort for a property, or an object according to docs
 * @param args.or {Boolean} if set to true, filters will be applied as OR. False for AND
 * @param args.limit {Number} limit results to specified number
 *
 * @returns {Promise<void>}
 */
async function getAllFiltered(complexFilterObject, args){
    //we allow complex filtering with this function.
    complexFilterObject = (complexFilterObject === undefined) ? [] : complexFilterObject;
    args = (args === undefined) ? {} : args;
    let defaultArgs = {
        sort: {"timestamp": -1},
        or: false,
    }
    args = Object.assign(defaultArgs, args);

    //parse filters to Mongo format
    let filterArray = [];

    complexFilterObject.forEach(function(filter) {
        let universalFilter = {};
        if (filter.filter === undefined || filter.value === undefined) {
            //invalid, ignore entry
        }
        else {
            universalFilter[filter.filter] = filter.value;
            filterArray.push(universalFilter);
        }
    })

    let newslist = News.find();
    //apply filter
    if(filterArray.length > 0) {
        if(args.or) {
            newslist = newslist.or(filterArray)
        }
        else {
            newslist = newslist.and(filterArray)
        }
    }
    newslist = newslist.populate({
        path: 'author',
        select: 'generalData username',
    });


    if (args.sort) {
        newslist = newslist.sort(args.sort);
    }
    if(args.limit) {
        newslist = newslist.limit(args.limit)
    }

    return newslist;
}

/**
 * Gets a news entry by its id
 * @param {id} id id of the event
 */
async function getById(id) {
    return News.findById(id).populate({
        path: 'author',
        select: 'generalData username',
    }).sort({"timestamp": -1});
}


/**
 * Creates a new news entry from data object and saves it to the db
 * @param {Object} data The object to save as event
 */
async function create(req, data) {
    //validation

    let news = new News(data);
    let log = new Log({
        type: "activity",
        action: {
            objectType: "news",
            actionType: "create",
            actionDetail: "newsAdd",
            key: news._id,
            value: news.title.value,
        },
        authorizedUser: req.user,
        target: {
            targetType: "news",
            targetObject: news._id,
            targetObjectId: news._id,
            targetModel: "News",
        },
        httpRequest: {
            method: req.method,
            url: req.originalUrl,
        }
    })
    return new Promise(function(resolve, reject){
        news.save()
            .then(result => {
                LogService.create(log).then().catch();
                resolve(result);
            })
            .catch(err => {
                reject(err);
            })
    });
}

async function update(req, id, data) {
    const errMsg = "Failed to update News entry: "
    if (data === undefined) {
        throw new Error("Invalid data received.")
    }
    let news = await News.findById(id);
    if(!news) {
        throw new Error("Unable to find news entry with ID:" + id);
    }

    news = Object.assign(news, data);
    let log = new Log({
        type: "modification",
        action: {
            objectType: "news",
            actionType: "create",
            actionDetail: "newsModify",
            key: news.id,
            value: news.title.value,
        },
        authorizedUser: req.user,
        target: {
            targetType: "news",
            targetObject: news._id,
            targetObjectId: news._id,
            targetModel: "News",
        },
        httpRequest: {
            method: req.method,
            url: req.originalUrl,
        }
    })
    return new Promise(function(resolve, reject){
        news.save()
            .then(result => {
                resolve(news);
                LogService.create(log).then().catch();
            })
            .catch(err => {

            })
    })

}

/**
 * Deletes a news entry
 * @param req {Object} express request
 * @param {number} id id of log to delete
 */
async function _delete(req, id) {
    let news = await News.findById(id)
    // validate
    if (!news) throw new Error('News not found');
    //check write access
    let log = new Log({
        type: "modification",
        action: {
            objectType: "news",
            actionType: "delete",
            actionDetail: "newsRemove",
            key: news.id,
            value: news.title.value,
            tag: "<DELETE>"
        },
        authorizedUser: req.user,
        target: {
            targetType: "news",
            targetObject: news._id,
            targetObjectId: news._id,
            targetModel: "News",
            targetState: "DELETED"
        },
        httpRequest: {
            method: req.method,
            url: req.originalUrl,
        }
    })
    await News.findByIdAndRemove(id);
    LogService.create(log).then().catch();
    return true;
}

/**
 * Deletes a news entry
 * @param req {Object} express request
 * @param {number} id id of log to delete
 */
async function _deleteAll() {
    return News.deleteMany()
}