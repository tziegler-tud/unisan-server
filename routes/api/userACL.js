var express = require('express');
var uuid = require('uuid');
const passport = require('passport');
var router = express.Router();
const bodyParser = require("body-parser");
const userGroupService = require("../../services/userGroupService");
const aclService = require("../../services/aclService");
const authService = require("../../services/authService");
const AuthService = require("../../services/authService");

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//hooked at /api/v1/acl

// routes
//debug functions, remove for production TODO: remove before production
router.post("/rebuildFromData", rebuildFromUserData);
router.post("/rebuildNew", rebuildUserAcls)
router.post("/updateAllUser", updateAllUser)

router.get('/', checkRead, getAll);
router.get('/current', getCurrentAcl);
router.get('/docker', getCurrentDockerArgs);
router.get('/:id', checkRead, getUserACL);
router.post('/:id', checkWrite, createUserACL);
router.put('/:id', checkWrite, updateUserACL);
router.delete('/:id', checkWrite, deleteACL);
// router.post('/addGroup/:id', addGroup);
// router.delete('/removeGroup/:id',removeGroup);


function checkRead(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.access.READACL)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}

function checkReadRole(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.access.READUSERROLE)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}

function checkWriteRole(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.access.WRITEUSERROLE)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}

function checkWrite(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.access.WRITEACL)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}



function getAll(req, res, next){
    aclService.getAll()
        .then(result => res.json(result))
        .catch(err => next(err));
}

function getUserACL(req, res, next){
    aclService.getUserACL(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function getCurrentAcl(req, res, next){
    authService.auth(req.user, authService.operations.user.READSELF)
        .then(result => {
            aclService.getUserACL(req.user.id, false)
                .then(userACL => userACL ? res.json(userACL) : res.sendStatus(404))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}

function getCurrentDockerArgs(req, res, next){
    authService.auth(req.user, authService.operations.user.READSELF)
        .then(result => {
            aclService.getUserACL(req.user.id, false)
                .then(userACL => userACL ? res.json(userACL.docker) : res.sendStatus(404))
                .catch(err => next(err));
        })
        .catch(err =>{
            next(err);
        })
}


function createUserACL(req, res, next){
    aclService.createUserACL(req, req.params.id, req.body.data, req.body.overwrite)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function updateUserACL(req, res, next){
    aclService.update(req, req.params.id, req.body)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function deleteACL(req, res, next){
    aclService.remove(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function addGroup(req, res, next){
    aclService.addUserGroup(req, req.params.id, req.body.groupId)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function removeGroup(req, res, next){
    aclService.removeUserGroup(req, req.params.id, req.body.groupId)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function rebuildFromUserData(req, res, next){
    aclService.rebuildFromUserData()
        .then(result => res.json(result))
        .catch(err => next(err))
}

function rebuildUserAcls(req, res, next){
    aclService.rebuildFresh()
        .then(result => res.json(result))
        .catch(err => next(err))
}

function updateAllUser(req, res, next){
    aclService.updateAllUser(req)
        .then(result => res.json(result))
        .catch(err => next(err))
}

module.exports = router;
