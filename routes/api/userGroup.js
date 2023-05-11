import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import userGroupService from "../../services/userGroupService.js";
import AuthService from "../../services/authService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//hooked at /api/v1/groups

function checkRead(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.groups.READ)
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
    AuthService.auth(req.user, AuthService.operations.groups.WRITE)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}


function checkCreate(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.groups.CREATE)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}


function checkDelete(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.groups.DELETE)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}


function checkReadAssigned(req, res, next){
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

// routes
router.get('/', checkRead, getUserGroups);
router.post('', checkCreate, createGroup);
router.put('/:id', checkWrite, updateGroup);
router.delete('/:id', checkDelete, deleteGroup);
router.get('/:id', checkRead, getGroup);
router.get("/assigned/:id", checkReadAssigned, getAssignedUser);
router.post('/addPermission/:id', checkWrite, addGroupPermission);
router.delete('/removePermission/:id', checkWrite, removeGroupPermission);

function getUserGroups(req, res, next){
    userGroupService.getAll()
        .then(result => res.json(result))
        .catch(err => next(err));
}

function createGroup(req, res, next){
    userGroupService.create(req, req.body.data, req.body.args)
        .then(result => {
            res.json(result)
        })
        .catch(err => next(err));
}

function updateGroup(req, res, next){
    userGroupService.update(req, req.params.id, req.body, false)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function deleteGroup(req, res, next){
    userGroupService._delete(req, req.params.id, false)
        .then(function(result) {
            res.status(200).send()
        })
        .catch(function(err){
            next(err)
        });
}

function getGroup(req, res, next){
    userGroupService.getById(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function addGroupPermission(req, res, next){
    userGroupService.addPermission(req, req.params.id, req.body.operation, false)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function removeGroupPermission(req, res, next){
    userGroupService.removePermission(req, req.params.id, req.body.operation, false)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function getAssignedUser (req, res, next) {
    userGroupService.getAssignedUser(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}



export default router;
