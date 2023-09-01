import express from 'express';
var router = express.Router();
import bcrypt from 'bcrypt';
import bodyParser from "body-parser";
import userService from "../../services/userService.js";
import LogService from '../../services/logService.js';
import AuthService from "../../services/authService.js";
import UserGroupService from "../../services/userGroupService.js";
import aclService from "../../services/aclService.js";
import Log from '../../utils/log.js';

import path from 'path';
import fs from 'fs-extra';

import upload from "../../config/multer.js";





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
        userService.getById(req.params.id)
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

router.post('/updateCurrentUserPassword', updateCurrentUserPassword);
router.post('/updateUserPassword', updateUserPassword);

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

export default router;

function create(req, res, next) {
    //auth
    AuthService.auth(req.user, AuthService.operations.user.CREATE)
        .then(result => {
            //req.body might contain args argument, strip it from body
            let args = (req.body.args === undefined ? {} : req.body.args);
            req.body.args = {};
            userService.create(req, req.body, args)
                .then((user) => {
                    res.json(user)
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err =>{
            next(err);
        })

}

function getAll(req, res, next) {
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            userService.getAll()
                .then(users => res.json(users))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })

}

function getCurrent(req, res, next) {
    //no auth required
    userService.getById(req.user.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            userService.getById(req.params.id)
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
            userService.getByUsername(req.params.username)
                .then(user => user ? res.json(user) : res.sendStatus(404))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function update(req, res, next) {
    //auth
    AuthService.checkUserWriteAccess(req.user, req.params.id, true)
        .then(result => {
            userService.update(req, req.params.id, req.body)
                .then(() => res.json({}))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function updateCurrentUserPassword(req, res, next) {
    //routine for the current user updating its own password. requires the current password to be correct.
    //auth
    if (!req.body.currentPassword || !req.body.newPassword) {
        return false;
    }
    let password = req.body.currentPassword;
    let newPassword = req.body.newPassword;
    AuthService.checkUserWriteAccess(req.user, "self", true)
        .then(result => {

            userService.getUserHash(req.user)
                .then(user=> {
                    //verify password is correct
                    bcrypt.compare(password, user.hash)
                        .then(result => {
                            if(result) {
                                //password matches. set new Password
                                userService.updatePassword(req, req.user.id, newPassword)
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

function updateUserPassword(req, res, next) {
    //routine for the current user updating its own password. requires the current password to be correct.
    //auth
    if (!req.body.newPassword) {
        return false;
    }
    let newPassword = req.body.newPassword;
    let targetUserId = req.body.userid;

    //get target user
    userService.getById(targetUserId)
        .then(targetUser => {
            AuthService.checkUserWriteAccess(req.user, targetUser, true)
                .then(result => {
                    userService.getUserHash(targetUser)
                        .then(targetWithHash=> {
                            //password matches. set new Password
                            userService.updatePassword(req, targetUser.id, newPassword)
                                .then(result => {
                                    res.json({})
                                })
                                .catch(err => {
                                    next(err)
                                });
                            })
                            .catch(err => {
                                next(err);
                            })
                        })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err =>{
            next(err);
        })
}


function getKey(req, res, next) {
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            userService.getKey(req.params.id, req.body.key)
                .then(() => res.json({}))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function updateKey(req, res, next) {
    if(req.params.id === undefined || req.body.key === undefined || req.body.value === undefined) {
        let err = {name: "ValidationError", message: "Validation failed."}
        next(err);
    }
    //auth
    else {
        let critical = (req.body.key === "password" || req.body.key === "username");
        AuthService.checkUserWriteAccess(req.user, req.params.id, critical)
            .then(result => {
                userService.updateKey(req, req.params.id, req.body.key, req.body.value, req.body.args)
                    .then((result) => res.json({result}))
                    .catch(err => next(err));
            })
            .catch(err =>{
                next(err);
            })
    }

}

function addQualification(req, res, next) {
    //auth
    AuthService.checkUserWriteAccess(req.user, req.params.id, false)
        .then(result => {
            userService.addQualification(req, req.params.id, req.body.data, req.body.args)
                .then((result) => res.json({result}))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function updateQualification(req, res, next) {
    //auth
    AuthService.checkUserWriteAccess(req.user, req.params.id, false)
        .then(result => {
            userService.updateQualification(req, req.params.id, req.body.id, req.body.data, req.body.args)
                .then((result) => res.json({result}))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function removeQualification(req, res, next) {
    //auth
    AuthService.checkUserWriteAccess(req.user, req.params.id, false)
        .then(result => {
            userService.removeQualification(req, req.params.id, req.body.id, req.body.args)
                .then((result) => res.json({result}))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function deleteKey(req, res, next) {
    if(req.params.id === undefined || req.body.key === undefined) {
        let err = {name: "ValidationError", message: "Validation failed."}
        next(err);
    }
    //auth
    else {
        let critical = (req.body.key === "password" || req.body.key === "username");
        //auth
        AuthService.checkUserWriteAccess(req.user, req.params.id, critical)
            .then(result => {
                if (req.body.isArray) {
                    userService.deleteArrayElement(req, req.params.id, req.body.key, req.body.args)
                        .then(() => res.json({}))
                        .catch(err => next(err));

                } else {
                    userService.deleteKey(req, req.params.id, req.body.key, req.body.args)
                        .then(() => res.json({}))
                        .catch(err => next(err));
                }
            })
            .catch(err => {
                next(err);
            })
    }
}

function matchAny(req, res, next){
    //auth
    AuthService.auth(req.user, AuthService.operations.user.READ)
        .then(result => {
            if (req.body.filter === undefined) req.body.filter = "";
            userService.matchAny(req.body.filter, req.body.args)
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
            userService.filterByGroup(req.body.filter, req.body.groupId, req.body.args)
                .then(function(userlist) {
                    res.json(userlist);
                })
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function addUserGroup(req, res, next){
    //validate
    if(req.params.id === undefined || req.body.userGroupId === undefined) {
        let err = {name: "ValidationError", message: "Validation failed."}
        next(err);
    }
    //get user group form id
    UserGroupService.getById(req.body.userGroupId)
        .then(group => {
            AuthService.checkUserGroupWriteAccess(req.user, req.params.id, group, true)
                .then(result => {
                    userService.addUserGroup(req, req.params.id, group)
                        .then(function(user) {
                            res.json(user);
                        })
                        .catch(err => {
                            next(err)
                        });
                })
                .catch(err =>{
                    next(err);
                })
        })
        .catch(err => next(err))


}

function removeUserGroup(req, res, next){
    //validate
    if(req.params.id === undefined || req.body.userGroupId === undefined) {
        let err = {name: "ValidationError", message: "Validation failed."}
        next(err);
    }
    //get user group form id
    UserGroupService.getById(req.body.userGroupId)
        .then(group => {
            AuthService.checkUserGroupWriteAccess(req.user, req.params.id, group, false)
                .then(result => {
                    userService.removeUserGroup(req, req.params.id, req.body.userGroupId)
                        .then(function (user) {
                            res.json(user);
                        })
                        .catch(err => next(err));
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => next(err))
}

function setUserRole(req, res, next){
    //validate
    if(req.params.id === undefined || req.body.role === undefined) {
        let err = {name: "ValidationError", message: "Validation failed."}
        next(err);
    }
    AuthService.checkUserRoleWriteAccess(req.user, req.params.id, req.body.role)
        .then(result => {
            aclService.setUserRole(req, req.params.id, req.body.role)
                .then(function(result){
                    res.status(200).json({success: true});
                })
                .catch(err=>next(err))
        })
        .catch(err =>{
            next(err);
        })
}

function _delete(req, res, next) {
    AuthService.checkUserDeleteAccess(req.user, req.params.id)
        .then(result => {
            userService.delete(req, req.params.id)
                .then(() => res.json({}))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function setPrivacyAgreement(req, res, next) {
    //auth
    AuthService.checkUserWriteAccess(req.user, req.params.id, false)
        .then(result => {
            userService.setPrivacyAgreement(req, req.params.id, req.body.accept)
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
            userService.getAll()
                .then(function (userlist) {
                    let promiseArray = [];
                    userlist.forEach(function (user) {
                        promiseArray.push(new Promise(function (resolve, reject) {
                            AuthService.checkUserGroupWriteAccess(req.user, user, group, true)
                                .then(result => {
                                    userService.addUserGroup(req, user.id, group)
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
            userService.getAll()
                .then(function (userlist) {
                    let promiseArray = [];
                    userlist.forEach(function (user) {
                        promiseArray.push(new Promise(function (resolve, reject) {
                            AuthService.checkUserGroupWriteAccess(req.user, user, group, false)
                                .then(result => {
                                    userService.removeUserGroup(req, user.id, group)
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
    userService.clearDocuments()
        .then(function(result) {
            res.status(200).send();
        })
        .catch(err => next(err))
}


function transformQuals(req, res, next){
    userService.replaceQualificationsByRef()
        .then(function(result) {
            res.status(200).send();
        })
        .catch(err => next(err))
}
