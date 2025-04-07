import express from 'express';
var router = express.Router();
import bcrypt from 'bcryptjs';
import bodyParser from "body-parser";
import LogService from '../../services/logService.js';
import AuthService from "../../services/authService.js";
import UserGroupService from "../../services/userGroupService.js";
import aclService from "../../services/aclService.js";
import Log from '../../utils/log.js';

import path from 'path';
import fs from 'fs-extra';

import upload from "../../config/multer.js";
import userManager from "../../managers/userManager.js";
import UserService from "../../services/userService.js";




function postUpload (req, res, next) {
    const srcPath = appRoot + '/src/data/uploads/tmp/' + req.file.filename;

    //check if tmp
    if (req.params.id === "tmp") {
        //generate tmp access key with 5 digits
        var tmpkey = "";
        for (var i = 0; i < 5; i++) {
            tmpkey = tmpkey + Math.floor(Math.random() * 10);
        }

        //upload to tmp
        const targetPathRelative = `/data/uploads/tmp/${tmpkey}.jpg`
        const targetPath = appRoot + "/src" + targetPathRelative;

        fs.move(srcPath, targetPath, {overwrite: true}, function (err) {
            if (err) return console.error(err);
            console.log("moved file to tmp dir with filename " + tmpkey + ".jpg");
        });

        //return tmpkey
        res.json({
            success: true,
            url: targetPathRelative,
            tmpkey: tmpkey,
        });
    } else {
        UserService.getById(req.params.id)
            .then(user => {
                //upload to tmp
                const targetPathRelative = `/data/uploads/user_images/${user.id}/${user.id}.jpg`;
                const targetPath = appRoot + '/src' + targetPathRelative;

                fs.move(srcPath, targetPath, {overwrite: true}, function (err) {
                    if (err) return console.error(err);
                    console.log("moved file to user dir: " + user.id);
                });
                //create log
                let log = new Log({
                    type: "modification",
                    action: {
                        objectType: "user",
                        actionType: "modify",
                        actionDetail: "userImageModify",
                    },
                    authorizedUser: req.user,
                    target: {
                        targetType: "user",
                        targetObject: user._id,
                        targetModel: "User",
                    },
                    httpRequest: {
                        method: req.method,
                        url: req.originalUrl,
                    }
                })

                LogService.create(log).then().catch();
                res.json({
                    success: true,
                    url: targetPathRelative,
                });
            })
            .catch(err => next(err));
    }
}

// routes
//hooked at /api/v1/usermod

//check url access by user group
// router.use('/*', checkUrlAccess);
router.get('/clearDocuments', clearUserDocuments) //TODO: remove before deployment

router.post('/create', create);
router.get('/', getAll);
router.post('/filter', matchAny);
router.post('/filterByGroup', filterByGroup);
router.get('/current', getCurrent);
router.get('/getByName/:username', getByName);
router.get('/:id', getById);
router.post('/getKey/:id', getKey);

// //from this point, write access rights are required
// router.use("/*", checkWriteAccess);
router.put('/:id', update);
router.post('/:id/uploadUserImage', upload.single('image'), postUpload);
router.post('/:id/privacyAgreement', setPrivacyAgreement);

router.post('/updateUsername', updateUsername);
router.post('/updateCurrentUserPassword', updateCurrentUserPassword);
router.post('/updateUserPassword', updateUserPassword);

router.post('/updateInternalMail', updateInternalMail);


router.put('/updateKey/:id', updateKey);

router.post('/qualification/:id', addQualification);
router.put('/qualification/:id', updateQualification);
router.delete('/qualification/:id', removeQualification);

router.delete('/deleteKey/:id', deleteKey);
router.delete('/:id', _delete);

//access rights modifications require respective rights. set role paths carefully!
router.post('/addUserGroup/:id', addUserGroup);
router.post('/removeUserGroup/:id', removeUserGroup);
router.post('/addGroupToAllUser', addGroupToAllUser);
router.post('/removeGroupFromAllUser', removeGroupFromAllUser);

//role modification requires appropriate access rights
router.post('/setUserRole/:id', setUserRole);

router.post('/subscribe/:id', addPushSubscription);

export default router;

async function create(req, res, next) {
    //req.body might contain args argument, strip it from body
    let args = (req.body.args === undefined ? {} : req.body.args);
    req.body.args = {};
    if(args === undefined) {
        throw new ApiValidationError("Invalid arguments received")
    }
    try {
        //auth
        await AuthService.auth(req.user, AuthService.operations.user.CREATE)
        const user = await UserService.create(req, req.body, args)
        res.json(user)
    }
    catch(e){
        next(e);
    }
}

function getAll(req, res, next) {
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            UserService.getAll()
                .then(users => res.json(users))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })

}

function getCurrent(req, res, next) {
    //no auth required
    UserService.getById(req.user.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            UserService.getById(req.params.id)
                .then(user => user ? res.json(user) : res.sendStatus(404))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })

}

function getByName(req, res, next) {
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            UserService.getByUsername(req.params.username)
                .then(user => user ? res.json(user) : res.sendStatus(404))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

async function update(req, res, next) {
    const target = await UserService.getById(req.params.id);
    if(!target) {
        next(new ApiValidationError('Failed to update user: Target user not found.'))
    }
    else {
        //auth
        AuthService.checkUserWriteAccess(req.user, target, true)
            .then(result => {
                UserService.update(req, req.params.id, req.body)
                    .then(() => res.json({}))
                    .catch(err => next(err));
            })
            .catch(err =>{
                next(err);
            })
    }
}

function updateCurrentUserPassword(req, res, next) {
    //routine for the current user updating its own password. requires the current password to be correct.
    //auth
    if (!req.body.currentPassword || !req.body.newPassword) {
        return false;
    }
    let password = req.body.currentPassword;
    let newPassword = req.body.newPassword;
    AuthService.checkUserWriteAccessCritical(req.user, req.user)
        .then(result => {
            UserService.getUserHash(req.user)
                .then(user=> {
                    if(!user || user.hash === undefined) next()
                    //verify password is correct
                    bcrypt.compare(password, user.hash)
                        .then(result => {
                            if(result) {
                                //password matches. set new Password
                                UserService.updatePassword(req, req.user.id, newPassword)
                                    .then(result => {
                                        res.json({})
                                    })
                                    .catch(err => {
                                        next(err)
                                    });
                            }
                            else {
                                let err = {name: "ValidationError", message: "Validation failed."}
                                next(err);
                            }
                        })
                        .catch(err => {
                            next(err);
                        })
                })
        })
        .catch(err =>{
            next(err);
        })
}

async function updateUserPassword(req, res, next) {
    //routine for forcefully updating a user password. Requires appropriate access rights.
    //auth
    if (!req.body.newPassword) {
        return false;
    }
    let newPassword = req.body.newPassword;
    let targetUserId = req.body.userid;

    const target = await UserService.getById(targetUserId);
    if(!target) {
        next(new ApiValidationError('Failed to update user: Target user not found.'))
    }
    try {
        const access = AuthService.checkUserWriteAccessCritical(req.user, target)
    }
    catch(e){
        next(new ApiForbiddenError("Unable to update user password: Insufficient access rights."));
    }
    try {
        await UserService.updatePassword(req, target.id.toString(), newPassword)
        res.json({})
    }
    catch(e){
        next(e)

    }
}


function getKey(req, res, next) {
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            UserService.getKey(req.params.id, req.body.key)
                .then(() => res.json({}))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

async function updateUsername(req, res, next) {
    if(req.body.userid === undefined || req.body.username === undefined) {
        let err = new ApiValidationError("Validation failed")
        next(err);
    }
    //auth
    else {
        const userId = req.body.userid;
        const username = req.body.username;
        try {
            await AuthService.checkUserWriteAccessCritical(req.user, userId)
            UserService.updateUsername(req, userId, username)
                .then((result) => res.json({result}))
                .catch(err => next(err));
        }
        catch(e){
            next(e)
        }
    }
}

async function updateInternalMail(req, res, next) {
    if(req.body.userid === undefined || req.body.mail === undefined) {
        let err = {name: "ValidationError", message: "Validation failed."}
        next(err);
    }
    //auth
    else {
        const userId = req.body.userid;
        const mail = req.body.mail;
        try  {
            const target = await UserService.getById(userId)
            await AuthService.checkUserWriteAccessCritical(req.user, target)
            const result = await UserService.setInternalEmail(userId, mail, req.user)
            res.json({result})
        }
        catch (e) {
            next(e);
        }
    }
}

async function updateKey(req, res, next) {
    const targetId = req.params.id;
    const key = req.body.key;
    const value = req.body.value;
    if(targetId === undefined || key === undefined || value === undefined) {
        let err = ApiValidationError("Validation failed.");
        next(err);
    }
    try {
        const target = await UserService.getById(req.params.id)
        //auth
        await AuthService.checkUserWriteAccess(req.user, target)
        const result = await UserService.updateKey(req, targetId, key, value, req.body.args)
        res.json({result})
    }
    catch(e){
        next(e)
    }
}

async function addQualification(req, res, next) {
    const targetId = req.params.id;
    const data = req.body.data;
    if(targetId === undefined || data === undefined) {
        let err = ApiValidationError("Validation failed.");
        next(err);
    }
    try {
        const target = await UserService.getById(targetId)
        //auth
        await AuthService.checkUserWriteAccess(req.user, target, false)
        const result = await UserService.addQualification(req, targetId, data, req.body.args)
        res.json({result})
    }
    catch (e) {
        next(e)
    }
}

async function updateQualification(req, res, next) {
    const targetId = req.params.id;
    const data = req.body.data;
    const qualificationId = req.body.id;
    try {
        const target = await UserService.getById(targetId)
        await AuthService.checkUserWriteAccess(req.user, target, false);
        const result = await UserService.updateQualification(req, targetId, qualificationId, data, req.body.args)
        res.json({result})
    }
    catch (e) {
        next(e)
    }
}

async function removeQualification(req, res, next) {
    const targetId = req.params.id;
    const qualificationId = req.body.id;
    try {
        const target = await UserService.getById(targetId)
        await AuthService.checkUserWriteAccess(req.user, target, false);
        const result = await UserService.removeQualification(req, targetId, qualificationId, req.body.args)
        res.json({result})
    }
    catch(e){
        next(e)
    }
}

async function deleteKey(req, res, next) {
    const targetId = req.params.id;
    const key = req.body.key;

    if(targetId === undefined || key === undefined) {
        let err = ApiValidationError( "Validation failed.");
        next(err);
    }
    else {
        let critical = (key === "password" || key === "username");
        try {
            const target = await UserService.getById(targetId)
            if (critical) {
                await AuthService.checkUserWriteAccessCritical(req.user, target);
            }
            else {
                await AuthService.checkUserWriteAccess(req.user, target);
            }
            if (req.body.isArray) {
                await UserService.deleteArrayElement(req, targetId, key, req.body.args)
            } else {
                await UserService.deleteKey(req, targetId, key, req.body.args)
            }
            res.json({})
        }
        catch(e){
            next(e)
        }
    }
}

function matchAny(req, res, next){
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            if (req.body.filter === undefined) req.body.filter = "";
            UserService.matchAny(req.body.filter, req.body.args)
                .then(function(userlist) {
                    res.json(userlist);
                })
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function filterByGroup(req, res, next){
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            if (req.body.filter === undefined) req.body.filter = "";
            UserService.filterByGroup(req.body.filter, req.body.groupId, req.body.args)
                .then(function(userlist) {
                    res.json(userlist);
                })
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

async function addUserGroup(req, res, next){
    const targetId = req.params.id
    const userGroupId = req.body.userGroupId
    //validate
    if(targetId === undefined || userGroupId === undefined) {
        let err = ApiValidationError("Validation failed.");
        next(err);
    }
    try {
        const target = await UserService.getById(targetId)
        //get user group form id
        const group = await UserGroupService.getById(userGroupId)
        await AuthService.checkUserGroupWriteAccess(req.user, target, group, true)
        const user = await UserService.addUserGroup(req, req.params.id, group)
        res.json(user);
    }
    catch(e){
        next(e)
    }

}

async function removeUserGroup(req, res, next){
    const targetId = req.params.id
    const userGroupId = req.body.userGroupId
    //validate
    if(targetId === undefined || userGroupId === undefined) {
        let err = ApiValidationError("Validation failed.");
        next(err);
    }

    try {
        const target = await UserService.getById(targetId)
        //get user group form id
        const group = await UserGroupService.getById(userGroupId)
        await AuthService.checkUserGroupWriteAccess(req.user, target, group, true)
        const user = await UserService.removeUserGroup(req, targetId, userGroupId)
        res.json(user);
    }
    catch(e){
        next(e)
    }
}

async function setUserRole(req, res, next){
    const targetId = req.params.id
    const role = req.body.role
    //validate
    if(targetId === undefined || role === undefined) {
        let err = ApiValidationError("Validation failed.");
        next(err);
    }

    try {
        const target = await UserService.getById(targetId)
        await AuthService.checkUserRoleWriteAccess(req.user, target, role)
        await  aclService.setUserRole(req, targetId, role)
        res.status(200).json({success: true});
    }
    catch (e) {
        next(e)
    }
}

async function _delete(req, res, next) {

    const targetId = req.params.id
    //validate
    if(targetId === undefined) {
        let err = ApiValidationError("Validation failed.");
        next(err);
    }

    try {
        const target = await UserService.getById(targetId)
        await AuthService.checkUserDeleteAccess(req.user, target)
        await UserService.delete(req, req.params.id)
        res.status(200).json({success: true});
    }
    catch (e) {
        next(e)
    }
}

function setPrivacyAgreement(req, res, next) {
    //auth
    AuthService.checkUserWriteAccess(req.user, req.params.id, false)
        .then(result => {
            UserService.setPrivacyAgreement(req, req.params.id, req.body.accept)
                .then((result) => res.json({privacyAgreement: result.privacyAgreement}))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function addGroupToAllUser(req, res, next){
    //validate
    if(req.body.userGroupId === undefined) {
        let err = {name: "ValidationError", message: "Validation failed."}
        next(err);
    }
    //get user group form id
    UserGroupService.getById(req.body.userGroupId)
        .then(group => {
            //get user list
            UserService.getAll()
                .then(function (userlist) {
                    let promiseArray = [];
                    userlist.forEach(function (user) {
                        promiseArray.push(new Promise(function (resolve, reject) {
                            AuthService.checkUserGroupWriteAccess(req.user, user, group, true)
                                .then(result => {
                                    UserService.addUserGroup(req, user.id, group)
                                        .then(user => {
                                            resolve();
                                        })
                                        .catch(function (err) {
                                            console.log("user not found.");
                                            reject();
                                        })
                                })
                        }))
                    })
                    Promise.all(promiseArray)
                        .then(resultArray => {
                            res.status(200).json({});
                        })
                        .catch(err => next(err))
                })
                .catch(err => next(err))
        })
        .catch(err => next(err));
}

function removeGroupFromAllUser(req, res, next){
    //validate
    if(req.body.userGroupId === undefined) {
        let err = {name: "ValidationError", message: "Validation failed."}
        next(err);
    }
    //get user group form id
    UserGroupService.getById(req.body.userGroupId)
        .then(group => {
            //get user list
            UserService.getAll()
                .then(function (userlist) {
                    let promiseArray = [];
                    userlist.forEach(function (user) {
                        promiseArray.push(new Promise(function (resolve, reject) {
                            AuthService.checkUserGroupWriteAccess(req.user, user, group, false)
                                .then(result => {
                                    UserService.removeUserGroup(req, user.id, group)
                                        .then(user => {
                                            resolve();
                                        })
                                        .catch(function (err) {
                                            console.log("Failed to remove group from user "+ user.username);
                                            reject();
                                        })
                                })
                        }))
                    })
                    Promise.all(promiseArray)
                        .then(resultArray => {
                            res.status(200).json({});
                        })
                        .catch(err => next(err))
                })
                .catch(err => next(err))
        })
        .catch(err => next(err));
}

function clearUserDocuments(req, res, next){
    UserService.clearDocuments()
        .then(function(result) {
            res.status(200).send();
        })
        .catch(err => next(err))
}


// function transformQuals(req, res, next){
//     UserService.replaceQualificationsByRef()
//         .then(function(result) {
//             res.status(200).send();
//         })
//         .catch(err => next(err))
// }


function addPushSubscription (req, res, next) {
    let err = new Error("invalid arguments received")
    if (req.body === undefined) {
        next(err);
    }
    if(req.body.user === undefined){
        next(err)
    }
    if(req.body.subscription === undefined){
        next(err)
    }

    var token = req.body.subscription.token;
    var isSafari = (req.headers['user-agent'].indexOf("Safari") > 0);
    var auth = req.body.subscription.auth;
    var endpoint = req.body.subscription.endpoint;

    UserService.getById(req.params.id)
        .then(function(user){
            userManager.registerPushSubscription(user, {token:token,auth:auth,isSafari:isSafari,endpoint:endpoint})
                .then(result => res.json(result))
                .catch(err => next(err));
        })
}
