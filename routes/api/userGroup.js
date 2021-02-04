var express = require('express');
var uuid = require('uuid');
const passport = require('passport');
var router = express.Router();
const bodyParser = require("body-parser");
const userGroupService = require("../../services/userGroupService");

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// routes
router.get('/', getUserGroups);
router.post('', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.get('/:id', getGroup);
router.post('/addPermission/:id', addGroupPermission);
router.post('/removePermission/:id', removeGroupPermission);

function getUserGroups(req, res, next){
    userGroupService.getAll()
        .then(result => res.json(result))
        .catch(err => next(err));
}

function createGroup(req, res, next){
    userGroupService.create(req.body)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function updateGroup(req, res, next){
    userGroupService.update(req.params.id, req.body)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function deleteGroup(req, res, next){
    userGroupService._delete(req.params.id)
        .then(result => res.status(200).send())
        .catch(err => next(err));
}

function getGroup(req, res, next){
    userGroupService.getById(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function addGroupPermission(req, res, next){
    userGroupService.addPermission(req.params.id, req.body.method, req.body.url)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function removeGroupPermission(req, res, next){
    userGroupService.removePermission(req.params.id, req.body.method, req.body.url)
        .then(result => res.json(result))
        .catch(err => next(err));
}




module.exports = router;
