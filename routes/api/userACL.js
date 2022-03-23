var express = require('express');
var uuid = require('uuid');
const passport = require('passport');
var router = express.Router();
const bodyParser = require("body-parser");
const userGroupService = require("../../services/userGroupService");
const aclService = require("../../services/aclService");

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//hooked at /api/v1/groups

// routes
router.get('/', getAll);
router.get('/:id', getUserACL);
router.post('/:id', createUserACL);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.get('/:id', getGroup);
router.get("/assigned/:id", getAssignedUser);
router.post('/addPermission/:id', addGroupPermission);
router.post('/updatePermission/:id', updateGroupPermission);
router.delete('/removePermission/:id', removeGroupPermission);

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


function createUserACL(req, res, next){
    aclService.createUserACL(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function addGroupPermission(req, res, next){
    userGroupService.addPermission(req.params.id, req.body.method, req.body.url)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function updateGroupPermission(req, res, next){
    userGroupService.updatePermission(req.params.id, req.body.currentMethod, req.body.currentUrl, req.body.newMethod, req.body.newUrl)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function removeGroupPermission(req, res, next){
    userGroupService.removePermission(req.params.id, req.body.method, req.body.url)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function getAssignedUser (req, res, next) {
    userGroupService.getAssignedUser(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}



module.exports = router;
