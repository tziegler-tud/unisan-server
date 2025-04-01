import bcrypt from 'bcryptjs';
import db from '../schemes/mongo.js';
import AuthService from './authService.js';
import LogService from "./logService.js";
import aclService from "./aclService.js";
import SystemService from "./SystemService.js";
import Log from '../utils/log.js';

import { Types as mongooseTypes } from 'mongoose';

const User = db.User;
const Event = db.Event;
const UserGroup = db.UserGroup;
const Qualifications = db.Qualifications;
const UserACL = db.UserACL;
const DbLog = db.Log;

import fs from 'fs-extra';
import UserGroupService from "./userGroupService.js";
import ServiceMiddleware from "./utility/ServiceMiddleware.js";
import AsyncServiceMiddleware from "./utility/AsyncServiceMiddleware.js";

/** @typedef {import("../schemes/userScheme.js").UserScheme} UserScheme */

/**
 * @typedef {Object} TitleValueStringObject
 * @property {string} title
 * @property {string} value
 */

/**
 * @typedef {Object} TitleValueNumberObject
 * @property {string} title
 * @property {number} value
 */

/**
 * @typedef {Object} TitleValueTypeObject
 * @property {string} title
 * @property {string} value
 * @property {string} type
 */

/**
 * @typedef {Object} UserGeneralData
 * @property {TitleValueStringObject} firstName
 * @property {TitleValueStringObject} lastName
 * @property {TitleValueNumberObject} memberId
 * @property {TitleValueTypeObject[]} customData
 */

/**
 * @typedef {Object} UserContactDataObject
 * @property {string} type
 * @property {string} title
 * @property {string} annotation
 * @property {any} value
 * @property {boolean} default
 */

/**
 * @typedef {Object} otherDataObject
 * @property {TitleValueStringObject[]} customData
 */

/**
 * @typedef {Object} QualificationObject
 * @property {mongooseTypes.ObjectId} qualification
 * @property {Date} acquiredDate
 * @property {Date} expireDate
 * @property {Date} trainingDate
 * @property {boolean} isValid
 * @property {boolean} hasDocument
 * @property {string} documentPath
 */

/** @typedef {Object} UserObject
 *  @property {mongooseTypes.ObjectId} id
 *  @property {string} username
 *  @property {string} internalEmail
 *  @property {Object} mail
 *  @property {string} mail.applicationToken
 *  @property {string} mail.senderName
 *  @property {UserGeneralData} generalData
 *  @property {UserContactDataObject[]} contactData
 *  @property {otherDataObject} otherData
 *  @property {string} hash
 *  @property {QualificationObject[]} qualfications
 *  @property {boolean} hasPhoto
 *  @property {boolean} isDisplayedOnPublic
 *  @property {boolean} loginEnabled
 *  @property {boolean} privacyAgreement
 *  @property {Date} createdDate
 */

/** @typedef {Object} UserUpdateObject
 *  @property {mongooseTypes.ObjectId} id
 *  @property {string} username
 *  @property {string} internalEmail
 *  @property {Object} mail
 *  @property {string} mail.applicationToken
 *  @property {string} mail.senderName
 *  @property {UserGeneralData} generalData
 *  @property {UserContactDataObject[]} contactData
 *  @property {otherDataObject} otherData
 *  @property {string} hash
 *  @property {QualificationObject[]} qualfications
 *  @property {boolean} hasPhoto
 *  @property {boolean} isDisplayedOnPublic
 *  @property {boolean} loginEnabled
 *  @property {boolean} privacyAgreement
 *  @property {Date} createdDate
 *  @property {string} password
 */


class UserService{

    constructor(){
        this.userCreateMiddlewareHooks = [];
        this.userCreateAsyncMiddlewareHooks = [];
        this.userCreatePostHooks = [];
        this.userCreateAsyncPostHooks = [];
        this.userDeleteAsyncPostHooks = [];
    }

    /*************************
     * Utility functions
     *************************/

    /**
     * Adds a function to be executed just before a new user is saved to the db.
     * Gets called with one argument, which is an object containing the default keys, and additonally a key "user" containing additional information on the user to be created
     * username: the username of the newly created user
     * memberId: the assigned memberId
     * @param {Function} func
     * @param {Object} defaultArgs
     */
    addUserCreateMiddleware(func, defaultArgs) {
        this.userCreateMiddlewareHooks.push(new ServiceMiddleware(func, defaultArgs))
    }

    /**
     * Adds an async function to be executed just before a new user is saved to the db.
     * Gets called with one argument, which is an object containing the default keys, and additonally a key "user" containing additional information on the user to be created
     * username: the username of the newly created user
     * memberId: the assigned memberId
     * @param {Function} func
     * @param {Object} defaultArgs
     */
    addUserCreateMiddlewareAsync(func, defaultArgs) {
        this.userCreateAsyncMiddlewareHooks.push(new AsyncServiceMiddleware(func, defaultArgs))
    }

    /**
     * Adds a function to be executed after a new user is created.
     * Gets called with one argument, which is an object containing the default keys, and additonally a key "user" containing the created user object.

     * if a key "user" already exists in default args, it is overwritten.
     * @param {Function} func
     * @param {Object} defaultArgs
     */
    addPostUserCreationHook(func, defaultArgs) {
        this.userCreatePostHooks.push(new ServiceMiddleware(func, defaultArgs));
    }

    /**
     * Adds a function to be executed after a new user is created.
     * Gets called with one argument, which is an object containing the default keys, and additonally a key "user" containing the created user object.

     * if a key "user" already exists in default args, it is overwritten.
     * @param {Function} func
     * @param {Object} defaultArgs
     */
    addPostUserCreationHookAsync(func, defaultArgs) {
        this.userCreateAsyncPostHooks.push(new AsyncServiceMiddleware(func, defaultArgs));
    }

    /**
     * Adds a function to be executed after a user is deleted.
     * Gets called with one argument, which is an object containing the default keys, and additonally a key "user" containing the deleted user object.
     * if a key "user" already exists in default args, it is overwritten.
     * @param {Function} func
     * @param {Object} defaultArgs
     */
    addPostUserDeleteHookAsync(func, defaultArgs) {
        this.userDeleteAsyncPostHooks.push(new AsyncServiceMiddleware(func, defaultArgs));
    }

    executeUserCreateMiddlewares(userObject) {
        return this._executeMiddlewares(this.userCreateMiddlewareHooks, userObject)
    }

    async executeUserCreateAsyncMiddlewares(userObject, allowModification=false) {
        return await this._executeAsyncMiddlewares(this.userCreateAsyncMiddlewareHooks, userObject)
    }

    executePostUserCreateMiddlewares(userObject) {
        return this._executeMiddlewares(this.userCreatePostHooks, userObject)
    }

    async executePostUserCreateMiddlewaresAsync(userObject) {
        return await this._executeAsyncMiddlewares(this.userCreateAsyncPostHooks, userObject)
    }

    async executePostUserDeleteMiddlewaresAsync(userObject) {
        return await this._executeAsyncMiddlewares(this.userDeleteAsyncPostHooks, userObject)
    }

    _executeMiddlewares(middlewareArray, userObject) {
        let updatedUserObject = userObject;

        for(let middleware of middlewareArray) {
            let middlewareResult = middleware.call({user: userObject})
            const result = middlewareResult.result;
            if(result) updatedUserObject = middlewareResult.data;
        }
        return updatedUserObject;
    }

    async _executeAsyncMiddlewares(middlewareArray, userObject) {
        let updatedUserObject = userObject;
        for(let middleware of middlewareArray) {
            let middlewareResult = await middleware.call({user: userObject})
            const result = middlewareResult.result;
            if(result) updatedUserObject = middlewareResult.data;
        }
        return updatedUserObject;
    }

    /***************************
     * User management methods
     **************************/

    /**
     * Gets all users
     */
    async getAll() {
        return User.find().select('-hash').populate("qualifications.qualification");
    }

    /**
     * Returns all users corresponding to the given array of ids.
     */
    async getManyById(idArray) {
        return User.find({
            '_id': {
                $in: idArray
            }
        }).select('-hash').populate("qualifications.qualification")
    }

    /**
     *
     * @param args
     * @returns {Promise<[User]>}
     */
    async getAllFiltered(args){
        let defaults = {
        }
        args = (args === undefined) ? {}: args;
        args = Object.assign(defaults, args);

        let filter = args.filter;
        let sort= args.sort;
        let query;
        if (filter===undefined || filter.filter === undefined || filter.value === undefined) {
            query = User.find().select("-hash");
        }
        else {
            let filterObj = {};
            filterObj[filter.filter] = filter.value;
            query = User.find(filterObj).select("-hash");
        }

        if(sort === undefined) {
            return query.populate("qualifications.qualification");
        }
        else {
            return query.sort(sort).populate("qualifications.qualification");
        }
    }


    /**
     * Gets a user by its id
     * @param {number} id The id of the user
     * @return Promise<UserObject>
     */
    async getById(id) {
        //populate userGroups
        return User.findById(id).select('-hash').populate("qualifications.qualification");

    }

    /**
     * returns the user object with the hash value retrieved
     * @param user
     * @returns {Promise<UserObject>}
     */
    async getUserHash(user){
        if (user === undefined) throw new Error("Failed to retrieve password hash from database: Invalid user object given")
        //check if user object or id was provided
        let id = user.id? user.id : user;
        return User.findById(id).select("hash");
    }

    /**
     * Gets a user by its username
     * @param {string} username The username to search for
     */
    async getByUsername(username) {
        return User.findOne({username: username}).select('-hash');
    }

    /**
     * gets a user by its username, and returns the assigned hash value with the document. Use this for authentication only.
     * @param username {String} username
     * @param populate {Boolean} if true, document is populated
     * @returns {Promise<Query<(Document<any, any, unknown> & Require_id<unknown>) | null, Document<any, any, unknown> & Require_id<unknown>, {}, unknown>>}
     */
    async getByUsernameWithHash(username, populate) {
        if (populate === undefined) populate = false;
        if (populate) {
            return User.findOne({username: username});
        }

        else {
            return User.findOne({username: username}); //nothing to populate rn, but we will leave this here just in case
        }
    }


    /**
     *
     * Creates a new user by a given object of the user scheme
     * @param req {Object} express request
     * @param userParam {UserScheme} The object to save as user
     * @param args {Object} further args for user creation. args = {userImg: {tmp: <boolean>, tmpKey: <integer>}}
     */
    async create(req, userParam, args) {
        const systemSettings = SystemService.getSettings();
        if (args === undefined) args = {};
        // validate
        if(userParam.generalData === undefined || userParam.username === undefined) throw new Error("Failed to create user: invalid data given");
        const username = userParam.username;
        if (await User.findOne({ username: username }))
            throw new Error(`Username "${userParam}" is already taken`);


        let memberId = undefined;
        //check if memberId is given
        if(userParam.generalData.memberId && userParam.generalData.memberId.value) {
            if (await User.findOne({ generalData: {memberId: {value: userParam.generalData.memberId.value }}}))
                throw new Error(`MemberId ` + userParam.generalData.memberId.value + ` is already taken`);
        }
        else {
            //check settings on how to auto-assign memberId
            if(systemSettings.members.memberId) {
                let offset = systemSettings.members.memberId.offset ?? 0;
                switch(systemSettings.members.memberId.mode) {
                    case 'auto':
                        //assign next number and increment offset
                        memberId = offset+1;
                        await SystemService.set({key: "members.memberId.offset", value: memberId});
                        break;
                    case 'auto-free':
                        //find lowest untaken number after offset
                        const presentMemberIdsOffset = await User.distinct('generalData.memberId.value', { "generalData.memberId.value": { $gte: offset} });
                        memberId = lowestMissing(presentMemberIdsOffset, offset);
                        break;
                    case 'free':
                        const presentMemberIds = await User.distinct('generalData.memberId.value');
                        memberId = lowestMissing(presentMemberIds, 0);
                        break;
                    default:
                    case 'unset':
                    case 'off':
                        //dont generate ID
                        memberId = undefined;

                }
                if (await User.findOne({ "generalData.memberId.value": memberId })) {
                    memberId = undefined;
                }
                userParam.generalData.memberId.value = memberId;
            }
        }



        let updatedUserParams = this.executeUserCreateMiddlewares(userParam, true)
        updatedUserParams = await this.executeUserCreateAsyncMiddlewares(updatedUserParams, true)
        userParam = updatedUserParams;
        const user = new User(userParam);
        // @louis: password is not mentioned in the userScheme. Is this correct? @Tom: yes, we only store hashes in the db
        // hash password
        if (userParam.password) {
            const salt = await bcrypt.genSalt(10);
            user.hash = await bcrypt.hash(userParam.password, salt);
        }

        //userCreate Middleware hooks


        //assign roles


        //create log
        let log = new Log({
            type: "modification",
            action: {
                objectType: "user",
                actionType: "create",
                actionDetail: "userCreate"
            },
            authorizedUser: req.user,
            target: {
                targetType: "user",
                targetObject: user._id,
                targetObjectId: user._id,
                targetModel: "User",
            },
            httpRequest: {
                method: req.method,
                url: req.originalUrl,
            }
        })

        // save user
        if(await user.save()){
            //create fresh acl document and assign user to it
            const userACL = new UserACL({user: user.id})
            userACL.save();
            //update log
            LogService.create(log)
                .then(
                )
                .catch(

                );
            //create user dir
            fs.ensureDir(appRoot + '/src/data/uploads/user_images/' + user._id.toString(), { recursive: true }, (err) => {
                if (err) {
                    console.error("Failed to create directory: " + '/src/data/uploads/user_images/' + user._id.toString());
                }
                else {
                    //check if tmp image exists
                    if (args.userImg.tmp) {
                        let tmpPath = appRoot + '/src/data/uploads/tmp/' + args.userImg.tmpkey + ".jpg";
                        //check if file exists
                        checkFileExists(tmpPath)
                            .then(function(exists){
                                if(exists) {
                                    try {
                                        fs.copyFile(tmpPath, appRoot + '/src/data/uploads/user_images/'+ user._id + '/' + user._id + '.jpg', (err) => {
                                            if (err) throw err;
                                        });
                                    }
                                    catch (err){
                                        let msg = "file system error: " + err;
                                        console.error(msg)
                                        console.warn("Failed to get uploaded file. Trying to remove file from storage...");
                                        fs.unlink(tmpPath)
                                            .then(function(){
                                                console.log("temporary file removed successfully.");
                                            })
                                            .catch(err => {
                                                console.error("Failed to remove temporary file: " + err);
                                            })
                                    }
                                }
                                else {
                                    console.warn("invalid temporary image file path. Copying dummy user image instead...")
                                    // copy dummy user image to user directory
                                    copyDummyImage();
                                }
                            })
                            .catch(err => console.error(err))
                    }
                    else {
                        // copy dummy user image to user directory
                        copyDummyImage();
                    }

                    function copyDummyImage(){
                        // copies the dummy user image to user directory
                        fs.copyFile(appRoot + '/src/data/user_images/dummy.jpg', appRoot + '/src/data/uploads/user_images/'+ user._id + '/' + user._id + '.jpg', (err) => {
                            if (err) {
                                console.warn("Failed to copy dummy user image: '/src/data/user_images/dummy.jpg': File not found.")
                            }
                        });
                    }
                }
            });
            let {hash: _, ...userNoHash} = user._doc;
            userNoHash.id = userNoHash._id;

            // execute post creation hooks
            this.executePostUserCreateMiddlewares(userNoHash)
            await this.executePostUserCreateMiddlewaresAsync(userNoHash)

            return userNoHash;
        }

        function lowestMissing(array, offset){
            const seen = new Map();
            for (let i = 0; i < array.length; i++) {
                seen.set(array[i]);
            }
            const max = Math.max(...array);
            for (let i = offset; i <= max ; i++) {
                if (!seen.has(i)) return i;
            }
            return max+1;
        }
    }

    /**
     * Updates non-critical properties on an existing user
     * @param req {Object} express request
     * @param {number} id The id of the existing user
     * @param {UserUpdateObject} updatedObject The object to save as user
     */
    async update(req, id, updatedObject) {

        const user = await User.findById(id);
        // validate
        if (!user) throw new Error('User not found');

        //only 1st level keys are supported!
        const disallowedKeys = ["hash", "username", "password"]
        for (const key of disallowedKeys) {
            if(updatedObject[key] !== undefined){
                console.log("userService: Trying to update disallowed key: " + key + ". Update operation for this key has been dismissed");
                delete updatedObject[key];
            }
        }

        return new Promise(function(resolve, reject) {
            // copy userParam properties to user
            Object.assign(user, updatedObject);
            user.save()
                .then(user => {
                    resolve(user)
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userModify",
                            key: "",
                            fullKey: "",
                            originalValue: "",
                            value: "",
                            tag: "<OVERWRITE>"
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        })
    }


    /**
     * Updates an existing users username
     * @param req {Object} express request
     * @param {number} id The id of the existing user
     * @param {String} username new username
     */
    async updateUsername(req, id, username) {
        const user = await User.findById(id);
        // validate
        const errMsg = "Failed to update username: ";
        if (!user) throw new Error(errMsg + 'User not found.');
        if (username === undefined || (typeof(username) !== 'string')){
            throw new Error(errMsg + 'Invalid parameter given for "username."');
        }
        if (await User.findOne({ username: username }))
            throw new Error(errMsg + `Username "${username}" is already taken`);

        const origValue = user.username;
        const newValue = username;

        return new Promise(function(resolve, reject) {
            // copy userParam properties to user
            user.username = username;
            user.save()
                .then(user => {
                    resolve(user)
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userModify",
                            key: "username",
                            fullKey: "username",
                            originalValue: origValue,
                            value: newValue,
                            tag: "<OVERWRITE>"
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        })
    }

    /**
     * Updates an existing user
     * @param req {Object} express request
     * @param {number} id The id of the existing user
     * @param {String} password Plaintext password. The password is hashed before beeing stored.
     */
    async updatePassword(req, id, password) {

        const user = await User.findById(id);
        // validate
        if (!user) throw new Error('User not found');
        let critical = true
        let userParam = {};
        // hash password if it was entered
        if (password) {
            userParam.hash = await bcrypt.hash(password, 10);
        }
        else return false;
        return new Promise(function(resolve, reject) {
            // copy userParam properties to user
            Object.assign(user, userParam);
            user.save()
                .then(user => {
                    resolve(user)
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userPasswordModify",
                            key: "password",
                            fullKey: "",
                            originalValue: "",
                            value: "",
                            tag: "<OVERWRITE>"
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        })
    }

    /**
     * Deletes a property of a given user
     * @param req {Object} express request
     * @param {number} id The id of the user to manipulate
     * @param {string} key Key to be deleted
     * @param {Object} userParams containing additional settings. Valid properties are: {isArray <bool>, noIndex: <bool> (true if key does not contain array element index)}
     */
    async deleteKey(req, id, key, userParams) {
        if (userParams === undefined) userParams = {};

        const user = await User.findById(id);

        // validate
        if (!user) throw new Error('User not found');
        return new Promise(function(resolve, reject) {
            //check write access
            // validate input
            if (!key) throw new Error('no key given');

            let ojVal = undefined;
            let logKey = key;

            // check if key exists
            if (!user.get(key)) {
                console.warn("Warning: Trying to remove invalid key.");
                return;
            }

            // check if key is in scheme
            if (user.schema.path(key) !== undefined) {
                // check if trying to delete required key
                if (user.schema.path(key).isRequired) {
                    // console.error('Trying to remove required key.');
                    throw new Error('Error: Trying to remove required key.')
                } else {

                }
            } else {
                console.warn("removing key which is not specified in scheme. Is this intended?")
            }

            // check if key references array element
            if (Array.isArray(user.get(key).parentArray())) {
                var msg = "Error: Deleting array elements is no longer provided by this method.";
                console.error(msg);
                throw new Error(msg);
            } else {
                let k = user.get(key);
                ojVal = (k.value === undefined) ? k : k.value;
                logKey = (k.title === undefined) ? key : k.title;
                user.set(key, undefined, {strict: false});
            }
            user.save()
                .then(user => {
                    resolve(user)
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userModify",
                            key: logKey,
                            fullKey: key,
                            originalValue: ojVal,
                            value: "",
                            tag: "<DELETED>",
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        })

    }

    /**
     *
     * Handler for removing arbitrary keys in the user document.
     *
     * @param req {Object} express request
     * @param id {number} The id of the user to manipulate
     * @param key {String} key to delete, use string with dot-notation
     * @param noIndex {Boolean} if set to false, assume key contains int denoting array index after last dot
     * @param arrayElementDbId {number} Id of the array element, if available
     *
     * @returns {Promise<void>}
     */

    async deleteArrayElement(req, id, key, args) {

        const user = await User.findById(id);

        // validate
        if (!user) throw new Error('User not found');

        // validate input
        if (!key) throw new Error('no key given');
        if (args === undefined || typeof(args) !== 'object') args = {};
        var noIndex = args.noIndex;
        var arrayElementDbId = args.arrayElementDbId;
        // if (arrayElementDbId === undefined) arrayElementDbId = 0;
        if (noIndex === undefined) noIndex = false;

        let ojVal = undefined;
        let logKey = key;

        var array;
        var parentArray;
        var index;

        if(noIndex) {
            //key refers to array.
            parentArray = user.get(key);
            if(arrayElementDbId === undefined) {
                const e = "Failed to delete array element: Wrong parameter settings.";
                console.error(e);
                throw new Error(e);
            }
        }
        //check if valid index is given. Assume key is of form: key.index
        else {
            try {
                //key refers to array element. We need to find the parent array.
                parentArray = user.get(key).parentArray();
                let keyPos = key.lastIndexOf(".");
                index = parseInt(key.substring(keyPos+1));
                //TODO: validate index using regex
                key = key.substring(0,keyPos);
            }
            catch(e) {
                console.warn("Failed to parse key to array element. Aborting delete operation.");
                throw(e);
                // we could try to catch other key types here, but we dont want to perform delete operation if something is not as intended. Better safe than sorry.
            }
        }

        // check if key exists
        if (!user.get(key)) {
            console.warn("Trying to remove invalid key!");
            return;
        }

        // check if key is in scheme
        if(user.schema.path(key)!==undefined) {
            // check if trying to delete required key
            if (user.schema.path(key).isRequired) {
                let msg = 'Trying to remove required key.';
                console.error(msg);
                throw new Error(msg);
            } else {

            }
        }
        else {
            console.warn("removing key which is not specified in scheme. Is this intended?")
        }

        // check if key is array
        if (!Array.isArray(user.get(key))){
            const msg = "Error: Key is not referencing an array.";
            console.error(msg);
            throw new Error(msg);
        }
        array = user.get(key)

        var updatedArray;
        // if array is indexed, we use id to remove the element
        if (arrayElementDbId !== undefined) {
            let rmObj = removeById(array, arrayElementDbId);
            updatedArray = rmObj.array;
            let el = rmObj.object;
            logKey = (el.title === undefined) ? el : el.title;
            ojVal  = (el.value === undefined) ? el : el.value;
        }
        else {
            if (!noIndex) {
                let rmObj = removeByIndex(array, index);
                updatedArray = rmObj.array;
                let el = rmObj.object;
                logKey = (el.title === undefined) ? "<complex object>" : el.title;
                ojVal  = (el.value === undefined) ? "<complex value>" : el.value;
            }
            else {
                const e = "Failed to delete array element: Wrong parameter settings.";
                console.error(e);
                throw new Error(e);
            }
        }
        user.set(key, updatedArray, {strict: false} );
        return user.save()
            .then( user => {
                //create log
                let log = new Log({
                    type: "modification",
                    action: {
                        objectType: "user",
                        actionType: "modify",
                        actionDetail: "userModify",
                        key: logKey,
                        fullKey: key,
                        originalValue: ojVal,
                        value:  "",
                        tag:  "<DELETED>",
                    },
                    authorizedUser: req.user,
                    target: {
                        targetType: "user",
                        targetObject: user._id,
                        targetObjectId: user._id,
                        targetModel: "User",
                    },
                    httpRequest: {
                        method: req.method,
                        url: req.originalUrl,
                    }
                })
                LogService.create(log).then().catch();
            })
    }

    /**
     * Retrieves a property of a user
     * @param {number} id The id of the user do manipulate
     * @param {string} key key to retrieve
     */
    async getKey(id, key) {
        const user = await User.findById(id);
        // validate
        if (!user) throw new Error('User not found');
        // validate input
        if (!key) throw new Error('no key given');

        return await user.get(key);
    }


    /**
     * Updates a property of a user, or inserts a new property if it doesnt exist
     * If the key is marked as array, the value is expected to be a JSON object of form value = {id: <ObjectId>, yourData..., ...}
     *
     * Note: this can be used to modify qualification entries, but it is recommended to use the dedicated api calls for qulification manipulation.
     *
     * @param req {Object} express request
     * @param {number} id The id of the user do manipulate
     * @param {string} key the key to update
     * @param {string} value the new value for the key
     * @param {Object} args containing additional settings. Valid properties are: {isArray: <bool>, noIndex: <bool>}
     */
    async updateKey(req, id, key, value, args={}) {
        const user = await User.findById(id);
        // validate
        if (!user) throw new Error('User not found');

        return new Promise(function(resolve, reject) {
            //check write access

            // validate input
            if (!key) throw new Error('no key given');
            if (!value) throw new Error('no value given');

            //only 1st level keys are supported!
            const disallowedKeys = ["hash", "username", "password"]
            if(disallowedKeys.includes(key)){
                console.log("userService: Trying to update disallowed key: " + key + ". Update operation for this key has been dismissed");
                throw new Error('Updating username or password is not allowed with this operation.');
            }

            let ojVal = undefined;
            let newVal = (value.value === undefined) ? value : value.value;
            let logKey = (value.title === undefined) ? key : value.title;

            //check if array operation
            if (args.isArray) {
                //get current array content. Usually, key refers to an indexed array element.
                if (!args.noIndex) {
                    const keyPos = key.lastIndexOf(".");
                    const i = key.substring(keyPos + 1);
                    key = key.substring(0, keyPos);
                }
                let array = user.get(key);
                // in-memory update.
                // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.

                try {
                    if (!Array.isArray(array)) throw new TypeError(`Key marked as array, but "${typeof (array)}" was found.`);
                    //check if array
                    //TODO: this does not work as intended. needs revision
                    var index = array.map(e => e._id.toString()).indexOf(value.id);

                } catch (e) {
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
                    // updating existing object
                    ojVal = array[index];
                    array.splice(index, 1, value);
                } else {
                    // key not found, creating new entry
                    array.push(value);
                }
                user.set(key, array, {strict: false});
            } else {
                let k = user.get(key);
                ojVal = (k.value === undefined) ? k : k.value;
                user.set(key, value, {strict: false});
            }
            user.save()
                .then(user => {
                    resolve(user)
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userModify",
                            key: logKey,
                            fullKey: key,
                            originalValue: ojVal,
                            value: newVal,
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        })
    }

    /**
     * adds a qualification object to the user document. This is the dedicated handler to add Qualifications.
     *
     *
     * @param req {Object} express request
     * @param {number} id The id of the user to manipulate
     * @param {Object} qualificationObject qualification object to be added.
     * @param {Object} args containing additional settings. Valid properties are: {}
     */
    async addQualification(req, id, qualificationObject,  args) {
        let defaults = {
            noIndex: false,

        }
        args = (args === undefined) ? {}: args;
        args = Object.assign(defaults, args);

        const user = await User.findById(id);
        const qualification = await Qualifications.findById(qualificationObject.qualification);

        // validate
        if (!user) throw new Error('User not found');

        return new Promise(function(resolve, reject) {
            let errHeader = "Failed to add Qualification: ";
            // validate input
            if (qualification === undefined) throw new Error(errHeader + 'Invalid parameters given for: qualificationObject');

            let ojVal = undefined;
            let newVal = qualification.name;
            let logKey = qualification.qualType;

            //get user qualification array
            let qualArray = user.qualifications;
            //validate array
            if (!Array.isArray(qualArray)) throw new Error(errHeader + "Failed to read qualification array from user document. User document might be corrupted. Aborting Operation.")

            //add qualfication entry to qualification object array
            qualArray.push(qualificationObject);

            user.save()
                .then(user => {
                    resolve(user);
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userAddQualification",
                            key: logKey,
                            fullKey: "qualification",
                            originalValue: ojVal,
                            value: newVal,
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        })
    }

    /**
     *
     * updates a single qualification entry of user
     * @param {Object} req - express request object.
     * @param {number} id - user id
     * @param {number} qualificationId - qualification entry id. Note this is not the qualificiation id from qualification collection, but a unique id associated to the array element specific for this user
     * @param {Object} data - qualification object
     * @param {Object} args - parameters: upsert <Boolean> inserts new entry if id is not present
     * @returns {Promise<void>}
     */

    async updateQualification(req, id, qualificationId, data, args) {
        let defaults = {
            noIndex: false,

        }
        args = (args === undefined) ? {}: args;
        args = Object.assign(defaults, args);

        const user = await User.findById(id);

        // validate
        if (!user) throw new Error('User not found');

        return new Promise(function(resolve, reject) {
            //check write access
            let errHeader = "Failed to add Qualification: ";
            // validate input
            if (data === undefined) throw new Error(errHeader + 'Invalid parameters given for: qualificationObject');

            let ojVal = undefined;
            let newVal = data.qualification.name;
            let logKey = data.qualification.qualType;

            var array = user.qualifications;
            //validate array
            if (!Array.isArray(array)) throw new Error(errHeader + "Failed to read qualification array from user document. User document might be corrupted. Aborting Operation.")

            // get current array content. Qualifications array is access by mongo ids.
            // in-memory update.
            // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.

            try {
                if (!Array.isArray(array)) throw new TypeError(`Failed to read qualifications array.`);
                //check if array
                var index = array.map(e => e._id.toString()).indexOf(qualificationId);
            } catch (e) {
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
                // updating existing object
                ojVal = array[index].qualification.name;
                array.splice(index, 1, data);
            } else {
                if (args.upsert) {
                    // key not found, creating new entry
                    array.push(data);
                } else throw new Error("Failed to update qualification entry: Invalid array id given");
            }
            let key = "qualifications";
            user.set(key, array, {strict: false});

            user.save()
                .then(user => {
                    resolve(user)
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userUpdateQualification",
                            key: logKey,
                            fullKey: "qualification",
                            originalValue: ojVal,
                            value: newVal,
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        })

    }

    async removeQualification(req, id, qualificationId, args) {
        let defaults = {
            noIndex: false,
            isIndex: false,
        }
        args = (args === undefined) ? {}: args;
        args = Object.assign(defaults, args);


        const user = await User.findById(id);
        // validate
        if (!user) throw new Error('User not found');

        return new Promise(function(resolve, reject) {


            // validate input
            if (qualificationId === undefined ) throw new Error("qualification not found: undefined id")
            //get current array content. Usually, qualificationId refers to corresponding id in the array.
            // Otherwise, use the isIndex parameter to allow accessing array by index
            var array = user.qualifications;
            let logKey = "qualifications";
            let fullKey = logKey;
            let ojVal = "";
            if (args.isIndex) {
                //qualificationId is array index
                let fullKey = logKey + "." + (qualificationId).toString();
                let rmObj = removeByIndex(array, qualificationId);
                array = rmObj.array;
                ojVal = rmObj.object.qualification.name;
            }
            else {
                //qualificationId is id
                let fullKey = logKey + "/" + (qualificationId).toString();
                let rmObj = removeById(array, qualificationId);
                array = rmObj.array;
                ojVal = rmObj.object.qualification.name;
            }

            let key = "qualifications";
            let value = array;
            user.set(key, value, {strict: false} );

            user.save()
                .then( user => {
                    resolve(user)
                    //create log
                    let log = new Log({
                        type: "modification",
                        action: {
                            objectType: "user",
                            actionType: "modify",
                            actionDetail: "userRemoveQualification",
                            key: logKey,
                            fullKey: fullKey,
                            originalValue: ojVal,
                            value:  ojVal,
                        },
                        authorizedUser: req.user,
                        target: {
                            targetType: "user",
                            targetObject: user._id,
                            targetObjectId: user._id,
                            targetModel: "User",
                        },
                        httpRequest: {
                            method: req.method,
                            url: req.originalUrl,
                        }
                    })
                    LogService.create(log).then().catch();
                })
                .catch(err => reject(err))
        })
    }

    /**
     *
     * @param matchString
     * @param args {Object}
     * @param args.sort {String} optional property to sort
     * @param args.filter {Object} filter object
     * @param args.filter.filter {String} property to filter for
     * @param args.filter.value {String} filter value. Accepts mongo syntax
     *
     * @returns {Promise<Query|*|number>}
     */
    async matchAny(matchString, args){

        if (args === undefined) args = {sort: "username"}
        let userlist;
        //matches a given string username, firstname and lastname
        //if filter is empty, return all results
        let filter = args.filter;

        if (filter===undefined || filter.filter === undefined || filter.value === undefined) {
            if (matchString.length === 0) {
                userlist = User.find();
            }
            else {
                userlist = User.find().or([{username: { $regex: matchString, $options: "i" }}, {'generalData.firstName.value': { $regex: matchString, $options: "i" }}, {'generalData.lastName.value': { $regex: matchString, $options: "i" }}])
            }
        }
        else {
            let filterObj = {};
            filterObj[filter.filter] = filter.value;
            userlist = User.find(filterObj).or([{username: { $regex: matchString, $options: "i" }}, {'generalData.firstName.value': { $regex: matchString, $options: "i" }}, {'generalData.lastName.value': { $regex: matchString, $options: "i" }}]).select("-hash");
        }
        //filter user by given string, using username, firstname and lastname attribute

        if (args.sort) {
            userlist = userlist.sort(args.sort);
        }


        return userlist;
    }


    /**
     *
     * @param matchString {String}
     * @param groupId {ObjectId} group id
     * @param args {Object} function arguments
     * @param args.sort {String} property to sort for
     * @param args.invert {Boolean} inverts selection, i.e. returns user that are not part of group
     * @param args.filter {Object} additional filters
     * @returns {Promise<Query|*|number>}
     */
    async filterByGroup(matchString, groupId, args){

        if (args === undefined) args = {}
        let defaultArgs = {sort: "username", invert: false, filter: undefined};
        args = Object.assign(defaultArgs, args);
        //matches a given string username, firstname and lastname + membership of given group
        //if filter is empty, return all results
        let filter = args.filter;

        if (groupId === undefined) {
            //fall back to standard filtering
            return matchAny(matchString, args);
        }
        //retrieve filtered userlist
        return new Promise (function(resolve, reject){
            matchAny(matchString, args)
                .then(userlist => {
                    //get user acls
                    let idArray = userlist.map(user => user._id);
                    aclService.getManyByUserId(idArray)
                        .then(aclList => {
                            let filteredList = userlist.filter(user => {
                                //find user acl in list
                                let userAcl = aclList.find(userAcl => userAcl.user.toString() === user.id.toString())
                                if (userAcl === undefined) return false
                                let isMember = userAcl.userGroups.includes(groupId)
                                if (args.invert) return !isMember
                                else return isMember;
                            })
                            resolve(filteredList)

                        })
                        .catch(err => {
                            reject(err)
                        })
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    /**
     * adds user to group
     * @param req {Object} express request
     * @param id user id
     * @param userGroup {ObjectId | UserGroup} id of group the user should be added to
     * @returns {Promise<*>}
     */

    async addUserGroup(req, id, userGroup){
        let user = await User.findById(id).select('-hash');
        let userGroupId, group;
        //check group argument
        if (typeof (userGroup) === "string") {
            //id given
            userGroupId = userGroup;
            group = await UserGroup.findById(userGroup);
        }
        else {
            if (userGroup.id !== undefined) {
                //group given
                userGroupId = userGroup.id;
                group = userGroup;
            }
        }
        // validate
        if (!group) throw new Error('UserGroup not found');
        if (!user) throw new Error('User not found');

        return new Promise(function(resolve, reject){
            //get user acl
            aclService.getUserACL(id, {populate: {userGroups: true}})
                .then(userACL=> {
                    //check if user already has userGroup assigned
                    if(userACL.userGroups.includes(userGroupId)){
                        console.log("User " + user.username + " already has UserGroup " + group.title + " assigned.");
                        resolve(user);
                    }
                    else {
                        userACL.userGroups.push(userGroupId);
                        //userACL.docker = aclService.buildDockerObject(userACL)
                        userACL.save()
                            .then( userACL => {
                                console.log("user " + user.username + " has been assigned to group.");
                                resolve(user);
                                //create log
                                let log = new Log({
                                    type: "modification",
                                    action: {
                                        objectType: "user",
                                        actionType: "accessModify",
                                        actionDetail: "userGroupAdd",
                                        key: "",
                                        value: group.title
                                    },
                                    authorizedUser: req.user,
                                    target: {
                                        targetType: "user",
                                        targetObject: user._id,
                                        targetObjectId: user._id,
                                        targetModel: "User",
                                    },
                                    httpRequest: {
                                        method: req.method,
                                        url: req.originalUrl,
                                    }
                                })
                                LogService.create(log).then().catch();
                            })
                            .catch(err => reject(err))
                    }
                })
                .catch(err => reject(err))
        })
    }

    /**
     * removes user from group
     * @param req {Object} express request
     * @param id user id
     * @param userGroup {String | Object} id of group the user should be removed from
     * @returns {Promise<*>}
     */

    async removeUserGroup(req, id, userGroup){
        let user = await User.findById(id).select('-hash');

        let userGroupId, group;
        //check group argument
        if (typeof (userGroup) === "string") {
            //id given
            userGroupId = userGroup;
            group = await UserGroup.findById(userGroup);
        }
        else {
            if (userGroup.id !== undefined) {
                //group given
                userGroupId = userGroup.id;
                group = userGroup;
            }
        }
        // validate
        if (!user) throw new Error('User not found');
        if (!group) throw new Error('invalid user group');

        return new Promise(function(resolve, reject){
            //check if user has userGroup assigned
            aclService.getUserACL(id, {populate: {userGroups: false}})
                .then(userACL=> {
                    //check if user has userGroup assigned
                    let index = userACL.userGroups.findIndex(g => {
                        return g.toString() === userGroupId
                    });
                    if(index > -1){
                        // remove group
                        userACL.userGroups.splice(index, 1);
                        //userACL.docker = aclService.buildDockerObject(userACL)
                        userACL.save()
                            .then( userACL => {
                                resolve(user);
                                //create log
                                let log = new Log({
                                    type: "modification",
                                    action: {
                                        objectType: "user",
                                        actionType: "accessModify",
                                        actionDetail: "userGroupDelete",
                                        key: "",
                                        value: group.title,
                                    },
                                    authorizedUser: req.user,
                                    target: {
                                        targetType: "user",
                                        targetObject: user._id,
                                        targetObjectId: user._id,
                                        targetModel: "User",
                                    },
                                    httpRequest: {
                                        method: req.method,
                                        url: req.originalUrl,
                                    }
                                })
                                LogService.create(log).then().catch();
                            })
                            .catch(err => reject(err))
                    }
                    else {
                        console.log("User " + user.username + " is not part of group " + group.title);
                        resolve(user);
                    }
                })
                .catch(err => reject(err));
        })

    }

    /**
     * adds individual event access to user
     * @param req {Object} express request
     * @param userid {ObjectId} target user id
     * @param target {ObjectId} target object id
     * @param operationArray {String[] | String} array containing operations to be granted
     *
     * @returns {Promise<*>}
     */

    async addIndividualEventAccess(req, userid, target, operationArray){
        let errmsg = "Failed to add Event access to user " + userid;
        if (Array.isArray(operationArray)){
            operationArray.forEach(operation => {
                if (!AuthService.checkIfValidOperation(operation)) {
                    throw new Error(errmsg + "Reason: Trying to add invalid operation.");
                }
            })
        }
        else {
            //check if single op was given
            if(AuthService.checkIfValidOperation(operationArray)){
                operationArray = [operationArray];
            }
            else {
                throw new Error(errmsg + "Reason: Trying to add invalid operation.");
            }
        }

        let user = await User.findById(userid).select('-hash');
        let event = await Event.findById(target);
        // validate
        if (!user) throw new Error('User not found');

        //all good, lets go
        return new Promise(function(resolve, reject){
            //check access
            //TODO: Finish this
            AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.access.GRANTEVENTCONTROL)
                .then(result => {
                    //get user acl
                    aclService.getUserACL(userid, {populate: {userGroups: false}})
                        .then(userACL=> {
                            if (userACL.individual === undefined) {
                                userACL.individual = {};
                            }
                            let index = userACL.individual.events.findIndex(object => {
                                if (object.target.title) {
                                    return object.target.id.toString() === target.toString()
                                }
                                else return object.target.toString() === target.toString()
                            })
                            if (index === -1){
                                //create new entry
                                let individualAclEntry = {
                                    target: target,
                                    allowedOperations: operationArray,
                                }
                                userACL.individual.events.push(individualAclEntry);
                                console.log("User " + user.username + " has been granted access rights for event " + target.toString());

                                userACL.save()
                                    .then( userACL => {
                                        console.log("user " + user.username + " has been granted event rights.");
                                        resolve(user);
                                        //create log
                                        let log = new Log({
                                            type: "modification",
                                            action: {
                                                objectType: "user",
                                                actionType: "accessModify",
                                                actionDetail: "userAccessRightsModify",
                                                key: target.toString(),
                                                value: operationArray.toString(),
                                            },
                                            authorizedUser: req.user,
                                            target: {
                                                targetType: "user",
                                                targetObject: user._id,
                                                targetObjectId: user._id,
                                                targetModel: "User",
                                            },
                                            httpRequest: {
                                                method: req.method,
                                                url: req.originalUrl,
                                            }
                                        })
                                        LogService.create(log).then().catch();
                                    })
                                    .catch(err => reject(err))
                            }
                            else {
                                //target entry exists
                                //update if additional
                                let entry = userACL.individual.events[index];
                                operationArray.forEach(operation => {
                                    //add if not present
                                    if (!entry.allowedOperations.includes(operation)){
                                        entry.allowedOperations.push(operation)
                                    }
                                })
                                userACL.individual.events.splice(index, 1, entry);
                                userACL.save()
                                    .then( userACL => {
                                        console.log("user " + user.username + " has been assigned to group.");
                                        resolve(user);
                                        //create log
                                        let log = new Log({
                                            type: "modification",
                                            action: {
                                                objectType: "user",
                                                actionType: "accessModify",
                                                actionDetail: "userAccessRightsModify",
                                                key: target.toString(),
                                                value: operationArray.toString(),
                                            },
                                            authorizedUser: req.user,
                                            target: {
                                                targetType: "user",
                                                targetObject: user._id,
                                                targetObjectId: user._id,
                                                targetModel: "User",
                                            },
                                            httpRequest: {
                                                method: req.method,
                                                url: req.originalUrl,
                                            }
                                        })
                                        LogService.create(log).then().catch();
                                    })
                                    .catch(err => reject(err))
                            }
                        })
                        .catch(err => reject(err))
                })
                .catch(err=> {
                    reject({status: 403, message: "Fehler: Sie haben keine Berechtigung, diesem Nutzer Schreibrechte für das gewählte Event zu gewähren."});
                })
        })
    }

    /**
     * removes individual event access from user
     * @param req {Object} express request
     * @param userid {ObjectId} target user id
     * @param target {ObjectId} target object id
     *
     * @returns {Promise<*>}
     */

    async removeIndividualEventAccess(req, userid, target){
        let user = await User.findById(userid).select('-hash');
        // validate
        if (!user) throw new Error('User not found');

        //all good, lets go
        return new Promise(function(resolve, reject){
            //check access
            //TODO: Finish this
            AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.access.REVOKEEVENTCONTROL)
                .then(result => {
                    //get user acl
                    aclService.getUserACL(userid, {populate: {userGroups: true}})
                        .then(userACL=> {
                            if (userACL.individual === undefined) {
                                reject("Failed to read individual access rights.")
                            }
                            let index = userACL.individual.events.findIndex(object => {
                                if (object.target.title) { //check if populated
                                    return object.target.id.toString() === target.toString()
                                }
                                else return object.target.toString() === target.toString()
                            })
                            if (index > -1){
                                //entry found. remove
                                let result = removeByIndex(userACL.individual.events, index);
                                let el = result.object;
                                let removedOperations = (el.allowedOperations !== undefined)? el.allowedOperations.toString() : "";

                                userACL.save()
                                    .then( userACL => {
                                        console.log("Event access revoked for " + user.username);
                                        resolve(user);
                                        //create log
                                        let log = new Log({
                                            type: "modification",
                                            action: {
                                                objectType: "user",
                                                actionType: "accessModify",
                                                actionDetail: "userAccessRightsModify",
                                                key: target.toString(),
                                                value: removedOperations,
                                            },
                                            authorizedUser: req.user,
                                            target: {
                                                targetType: "user",
                                                targetObject: user._id,
                                                targetObjectId: user._id,
                                                targetModel: "User",
                                            },
                                            httpRequest: {
                                                method: req.method,
                                                url: req.originalUrl,
                                            }
                                        })
                                        LogService.create(log).then().catch();
                                    })
                                    .catch(err => reject(err))
                            }
                            else {
                                //target entry exists
                                console.log("User " + user.username + " has no access rights for event " + target.toString());
                                resolve(user);
                            }
                        })
                        .catch(err => reject(err))
                })
                .catch(err=> {
                    reject({status: 403, message: "Fehler: Sie haben keine Berechtigung, diesem Nutzer Schreibrechte für das gewählte Event zu entziehen."});
                })
        })
    }


    /**
     * Deletes a user
     * @param req {Object} express request
     * @param {number} id The id of the user to delete
     */
    async delete(req, id) {

        let user = await User.findById(id);
        if(!user) {
            throw new Error("Failed to delete user with ID '" + id + "': User not found.")
        }
        let deletedUser = await User.findByIdAndRemove(id);
        let deleteUserACL = await UserACL.deleteOne({user: id});
        console.log("Deleted user with id: " + deletedUser._id);
        //create log
        let log = new Log({
            type: "modification",
            action: {
                objectType: "user",
                actionType: "delete",
                actionDetail: "userDelete",
                key: deletedUser.id,
                originalValue: deletedUser.username,
                value: "",
                tag: "<DELETE>"
            },
            authorizedUser: req.user,
            target: {
                targetType: "user",
                targetObject: deletedUser._id,
                targetObjectId: deletedUser._id,
                targetModel: "User",
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

        //run hooks
        await this.executePostUserDeleteMiddlewaresAsync(deletedUser);
        return deletedUser;
    }


    /*
    helpers
     */


    /**
     *
     * removes an element from an array by its mongo id
     *
     * @param {Object} array - array to remove element from
     * @param {number} id - mongo id of element to be removed
     * @returns {{array: {Object}, object: {Object}}}
     */
    removeById(array, id){
        // in-memory update. get current array content
        // using id values to compare objects. Attention: This assumes the arrays contain objects properly added to the mongoDb via mongoose.
        /** @type {any[]} */
        if(!Array.isArray(array)) throw new TypeError(`Key marked as array, but "${typeof(array)}" was found.`);

        var index = array.map(e => e._id.toString()).indexOf(id);
        if (index > -1) {
            // remove existing key from array
            let el = array[index];
            array.splice(index, 1);
            return {array: array, object: el};
        }
        else {
            //try to remove by index anyway.
            var msg = "Array element Id was not found in array. Aborting.";
            console.error(msg);
            throw new Error(msg);
        }
    }


    /**
     * removes an element from an array by its index
     *
     * @param {Object} array - array to remove element from
     * @param {number} index - index of element to remove. Note that arrays are 0-indexed.
     *
     * @returns {Object} {array: {Object}, object: {Object}}
     */
    removeByIndex(array, index){
        // array not indexed, remove by index
        try {
            let el = array[index];
            let key = (el.title === undefined) ? "" : el.title;
            let val = (el.value === undefined) ? el : el.value;
            array.splice(index, 1);
            return {array: array, object: el};
        }
        catch(e) {
            throw new Error(e);
        }
    }

    /**
     * savely checks if a file exists
     * returns a promise that resolves to true if the file exists, or false if it does not exist
     * @returns Promise<Boolean>
     */

    checkFileExists(path) {
        return new Promise(function(resolve, reject){
            fs.access(path, fs.constants.F_OK, error => {
                resolve(!error);
            })
        })
    }


    clearDocuments(){
        //remove usergroup and userrole
        return new Promise(function(resolve, reject){
            User.find()
                .then(userlist => {
                    userlist.forEach(user => {
                        User.updateOne({_id: user._id}, {$unset: {userRole: 1, userGroups: 1 }})
                    })
                    resolve();
                })
                .catch(err => reject(err))
        })
    }

    async ensureAdminUser(){
        const defaultUsername = "admin";
        const defaultPassword = "admin";
        //check if at least one user is present
        const users = await User.find();
        if(!Array.isArray(users) || users.length === 0) {
            //create default user
            console.log("Empty user database found. Creating default user with username/password: " + defaultUsername + "/" + defaultPassword);
            const defaultAdmin = new User({
                username: defaultUsername,
                generalData: {
                    firstName: {
                        value: "default"
                    },
                    lastName: {
                        value: "Admin"
                    },
                    memberId: {
                        value: 0,
                    },
                }
            })
            const salt = await bcrypt.genSalt(10);
            defaultAdmin.hash = await bcrypt.hash(defaultPassword, salt);
            const user = await defaultAdmin.save()
            const defaultGroups = await UserGroupService.getDefaultGroups();
            const userACL = new UserACL({user: user.id, userRole: "superadmin", userGroups: defaultGroups})
            return userACL.save()
        }
    }

    async setInternalEmail(userid, email){
        User.findById(userid)
            .then(user => {
                // validate
                if (!user) throw new Error('User not found');
                if (!email || typeof email !== "string" || !isValidMail(email)) throw new Error('invalid email given: ' + email);
                let key = "internalEmail"
                let ojValue = user.internalEmail ?? "";

                user.set(key, email);

                function isValidMail(){
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    return emailRegex.test(email);
                }

                user.save()
                    .then(user => {
                        return user;

                        let log = new Log({
                            type: "modification",
                            action: {
                                objectType: "user",
                                actionType: "modify",
                                actionDetail: "userModify",
                                key: key,
                                fullKey: key,
                                originalValue: ojValue,
                                value: email,
                            },
                            target: {
                                targetType: "user",
                                targetObject: user._id,
                                targetObjectId: user._id,
                                targetModel: "User",
                            },
                        })
                        LogService.create(log).then().catch();
                    })
                    .catch(err => {throw err})
            })
            .catch(err => {throw err})
    }

    async setEmailToken(userid, token){
        User.findById(userid)
            .then(user => {
                // validate
                if (!user) throw new Error('User not found');
                if (!token) throw new Error('no token given');
                let key = "mail.applicationToken"

                user.set(key, token);

                user.save()
                    .then(user => {
                        return user;
                        //create log
                        // let log = new Log({
                        //     type: "modification",
                        //     action: {
                        //         objectType: "user",
                        //         actionType: "modify",
                        //         actionDetail: "userModify",
                        //         key: logKey,
                        //         fullKey: key,
                        //         originalValue: "<hidden>",
                        //         value: "<hidden>",
                        //     },
                        //     authorizedUser: req.user,
                        //     target: {
                        //         targetType: "user",
                        //         targetObject: user._id,
                        //         targetObjectId: user._id,
                        //         targetModel: "User",
                        //     },
                        //     httpRequest: {
                        //         method: req.method,
                        //         url: req.originalUrl,
                        //     }
                        // })
                        // LogService.create(log).then().catch();
                    })
                    .catch(err => {throw err})
            })
            .catch(err => {throw err})
    }


    /**
     *
     * @param req
     * @param {String} userid
     * @param {Boolean} value
     * @returns {Promise<User>}
     */
    async setPrivacyAgreement(req, userid, value){
        const user = await User.findById(userid);
        // validate
        if (!user) throw new Error('User not found');

        //check current value
        const old = user.privacyAgreement;
        if(old === value){
            return user;
        }
        else {
            //set privacyAgreement key
            user.privacyAgreement = value;
            return new Promise(function(resolve, reject) {
                user.save()
                    .then(result => {
                        let log = new Log({
                            type: "server",
                            action: {
                                objectType: "user",
                                actionType: "modify",
                                actionDetail: "userSetPrivacyAgreement",
                                key: "privacyAgreement",
                                fullKey: "privacyAgreement",
                                originalValue: old,
                                value: value,
                                tag: "<OVERWRITE>"
                            },
                            authorizedUser: req.user,
                            target: {
                                targetType: "user",
                                targetObject: user._id,
                                targetObjectId: user._id,
                                targetModel: "User",
                            },
                            httpRequest: {
                                method: req.method,
                                url: req.originalUrl,
                            }
                        })
                        LogService.create(log).then().catch();
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
        }
    }
}

export default new UserService();


