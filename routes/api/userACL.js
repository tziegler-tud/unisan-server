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

//hooked at /api/v1/acl

// routes
router.get('/', getAll);
router.get('/:id', getUserACL);
router.post('/:id', createUserACL);
router.put('/:id', updateACL);
router.delete('/:id', deleteACL);
router.post('/addGroup/:id', addGroup);
router.delete('/removeGroup/:id', removeGroup);

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



module.exports = router;
