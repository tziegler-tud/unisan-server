var express = require('express');
var uuid = require('uuid');
const passport = require('passport');
var router = express.Router();
const bodyParser = require("body-parser");
const authService = require("../../services/userGroupService");

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
    authService.getAll()
        .then(result => res.json(result))
        .catch(err => next(err));
}

function createGroup(req, res, next){
    authService.create(req.body)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function updateGroup(req, res, next){
    authService.update(req.params.id, req.body)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function deleteGroup(req, res, next){
    authService._delete(req.params.id)
        .then(result => res.status(200).send())
        .catch(err => next(err));
}

function getGroup(req, res, next){
    authService.getById(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function addGroupPermission(req, res, next){
    authService.addPermission(req.params.id, req.body.method, req.body.url)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function removeGroupPermission(req, res, next){
    authService.removePermission(req.params.id, req.body.method, req.body.url)
        .then(result => res.json(result))
        .catch(err => next(err));
}




module.exports = router;
