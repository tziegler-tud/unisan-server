import bcrypt from 'bcrypt';
import db from '../schemes/mongo.js';
import mongoose from "mongoose";
import AuthService from './authService.js';
import Log from '../utils/log.js';

const News = db.News;
const User = db.User;
const dbLog = db.Log;



export default {
    getAll,
    getAllByAuthor,
    getAllByTags,
    getById,
    create,
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
    switch(combiner){
        case "AND":
            query = query.or(filterArray)
            break;
        case "OR":
        default:
            query = query.and(filterArray);
            break;
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
    complexFilterObject = (complexFilterObject === undefined) ? {} : complexFilterObject;
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
    if(args.or) {
        newslist = newslist.or(filterArray)
    }
    else {
        newslist = newslist.and(filterArray)
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
async function create(data) {
    //validation

    //save log
    let news = new News(data.toJson());
    await news.save();
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
    await News.findByIdAndRemove(id);
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