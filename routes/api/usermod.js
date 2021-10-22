const express = require('express');
const router = express.Router();
const userService = require('../../services/userService');
const uploadService = require('../../services/uploadService');
const authService = require('../../services/authService');
const LogService = require('../../services/logService');
const Log = require('../../utils/log');

var path = require('path');
var fs = require('fs-extra');

const upload = require(appRoot + "/config/multer");



router.post('/:id/uploadUserImage', upload.single('image'), function(req, res, next){
    //check if tmp
    if(req.params.id === "tmp") {
        //generate tmp access key with 5 digits
        var tmpkey = "";
        for (var i = 0; i < 5; i++){
            tmpkey = tmpkey + Math.floor(Math.random()*10);
        }

        //upload to tmp
        fs.move(appRoot + '/src/data/uploads/tmp/' + req.file.filename, appRoot + `/src/data/uploads/tmp/${tmpkey}.jpg`, { overwrite: true }, function (err) {
            if (err) return console.error(err);
            console.log("moved file to tmp dir with filename " + tmpkey + ".jpg");
        });

        //return tmpkey
        res.json({
            success: true,
            tmpkey: tmpkey,
        });
    }
    else {
        userService.getById(req.params.id)
            .then(user => {
                fs.move(appRoot + '/src/data/uploads/tmp/'+ req.file.filename, appRoot + `/src/data/uploads/user_images/${user.id}/${user.id}.jpg`, { overwrite: true }, function (err) {
                    if (err) return console.error(err);
                    console.log("moved file to user dir: " + user.id);
                });
                //log
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
                res.json({success: true});
            })
            .catch(err => next(err));
    }
});

function checkUrlAccess(req, res, next){
    authService.checkUrlPermission(req.user,req.method,req.originalUrl)
        .then(function(result){
            if(result){
                console.log("url authorization successful!");
                next();
            }
            else {
                console.log("authorization failed!");
                res.status(403).send();
            }
        })
        .catch(err => next(err))
}

// routes

//check url access by user group
router.use('/*', checkUrlAccess);

router.post('/create', create);
router.get('/', getAll);
router.post('/filter', matchAny);
router.get('/current', getCurrent);
router.get('/getByName/:username', getByName);
router.get('/:id', getById);
router.post('/getKey/:id', getKey);

// //from this point, write access rights are required
// router.use("/*", checkWriteAccess);
router.put('/:id', update);

router.put('/updateKey/:id', updateKey);

router.post('/qualification/:id', addQualification);
router.put('/qualification/:id', updateQualification);
router.delete('/qualification/:id', removeQualification);

router.delete('/deleteKey/:id', deleteKey);
router.delete('/:id', _delete);

//access rights modifications require respective rights. set role paths carefully!
router.post('/addUserGroup/:id', addUserGroup);
router.post('/removeUserGroup/:id', removeUserGroup);
router.post('/setUserRole/:id', setUserRole);
router.post('/addGroupToAllUser', addGroupToAllUser);

module.exports = router;

function create(req, res, next) {
    //req.body might contain args argument, strip it from body
    let args = (req.body.args === undefined ? {} : req.body.args);
    req.body.args = {};
  userService.create(req, req.body, args)
      .then(() => res.json(req.body))
      .catch(err => {
        next(err);
      })
}

function getAll(req, res, next) {
  userService.getAll()
      .then(users => res.json(users))
      .catch(err => next(err));
}

function getCurrent(req, res, next) {
  userService.getById(req.user.id)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}

function getById(req, res, next) {
  userService.getById(req.params.id)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}

function getByName(req, res, next) {
  userService.getByUsername(req.params.username)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}

function update(req, res, next) {
  userService.update(req, req.params.id, req.body)
      .then(() => res.json({}))
      .catch(err => next(err));
}

function getKey(req, res, next) {
    userService.getKey(req.params.id, req.body.key)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function updateKey(req, res, next) {
    userService.updateKey(req, req.params.id, req.body.key, req.body.value, req.body.args)
        .then((result) => res.json({result}))
        .catch(err => next(err));
}

function addQualification(req, res, next) {
    userService.addQualification(req, req.params.id, req.body.qualification, req.body.args)
        .then((result) => res.json({result}))
        .catch(err => next(err));
}

function updateQualification(req, res, next) {
    userService.updateQualification(req, req.params.id, req.body.key, req.body.value, req.body.args)
        .then((result) => res.json({result}))
        .catch(err => next(err));
}

function removeQualification(req, res, next) {
    userService.removeQualification(req, req.params.id, req.body.key, req.body.value, req.body.args)
        .then((result) => res.json({result}))
        .catch(err => next(err));
}

function deleteKey(req, res, next) {
    if(req.body.isArray){
        userService.deleteArrayElement(req, req.params.id, req.body.key, req.body.args)
            .then(() => res.json({}))
            .catch(err => next(err));
    }
    else {
        userService.deleteKey(req, req.params.id, req.body.key, req.body.args)
            .then(() => res.json({}))
            .catch(err => next(err));
    }
}

function matchAny(req, res, next){
    if (req.body.filter === undefined) req.body.filter = "";
    userService.matchAny(req.body.filter, req.body.args)
        .then(function(userlist) {
            res.json(userlist);
        })
        .catch(err => next(err));
}

function addUserGroup(req, res, next){
    userService.addUserGroup(req, req.params.id, req.body.userGroupId)
        .then(function(user) {
            res.json(user);
        })
        .catch(err => next(err));
}

function removeUserGroup(req, res, next){
    userService.removeUserGroup(req, req.params.id, req.body.userGroupId)
        .then(function(user) {
            res.json(user);
        })
        .catch(err => next(err));
}

function setUserRole(req, res, next){
    //get user list
    userService.setUserRole(req, req.params.id, req.body.role, req.user)
        .then(function(result){
            res.status(200).send();
            })
        .catch(err=>next(err))
}

function _delete(req, res, next) {
  userService.delete(req, req.params.id)
      .then(() => res.json({}))
      .catch(err => next(err));
}


function addGroupToAllUser(req, res, next){
    //get user list
    userService.getAll()
        .then(function(userlist){
            userlist.forEach(function(user){
                userService.addUserGroup(user.id, req.body.groupId)
                    .then(user=>console.log("user " + user.username + "has been assigned the role."))
            })
        })
}
