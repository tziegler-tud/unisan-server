var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const eventService = require('../../services/eventService');
const uploadService = require('../../services/uploadService');
const AuthService = require('../../services/authService');
const authService = new AuthService();

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());



var path = require('path');
var fs = require('fs-extra');

const upload = require(appRoot + "/config/multer");

router.post('/:id/uploadImage', upload.single('image'), function(req, res, next){
    eventService.getById(req.params.id)
        .then(event => {
            fs.move(appRoot + '/src/data/uploads/tmp/tmp.jpg', appRoot + `/src/data/uploads/event_images/${event.id}/${event.id}.jpg`, { overwrite: true }, function (err) {
                if (err) return console.error(err);
                console.log("moved file to user dir: " + event.id);
            });
            res.json({success: true});
        })
        .catch(err => next(err));
});

router.post('/:id/uploadFile', upload.single('image'), function(req, res, next){
    eventService.getById(req.params.id)
        .then(event => {
            fs.move(appRoot + '/src/data/uploads/tmp/tmp.jpg', appRoot + `/src/data/uploads/event_files/${event.id}/${req.body.filename}`, { overwrite: true }, function (err) {
                if (err) return console.error(err);
                console.log("moved file to dir: event_files/" + event.id);
            });
            res.json({success: true});
        })
        .catch(err => next(err));
});


auth = function(req, res, next){
    if (!req.isAuthenticated()) {
        req.session.redirectTo = '/unisams';
        console.log("");
        res.redirect('/unisams/login');
    } else {
        next();
    }
};




function checkUrlAccess(req, res, next){
    authService.checkUrlPermission(req.user,req.method,req.originalUrl)
        .then(function(result){
            if(result){
                console.log("authorization successful!");
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
router.post('/addParticipant', addParticipant);
router.post('/changeParticipant', changeParticipant);
router.post('/removeParticipant', removeParticipant);
router.get('/:id/populateParticipants', populateParticipants);
router.post('/:id/uploadImage', create);
router.post('/filter', matchAny);
router.get('/:id', getById);
router.put('/:id', update);
router.put('/updateKey/:id', updateKey);
router.delete('/:id', _delete);



module.exports = router;

function create(req, res, next) {
    eventService.create(req, req.body)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function getAll(req, res, next) {
    eventService.getAll()
        .then(events => res.json(events))
        .catch(err => next(err));
}

function getById(req, res, next) {
    eventService.getById(req.params.id)
        .then(event => event ? res.json(event) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    eventService.update(req, req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function updateKey(req, res, next) {
    eventService.updateKey(req, req.params.id, req.body.key, req.body.value)
        .then((result) => res.json(result))
        .catch(err => next(err));
}

function matchAny(req, res, next){
    if (req.body.filter === undefined) req.body.filter = "";
    eventService.matchAny(req.body.filter, req.body.args)
        .then(function(eventlist) {
            res.json(eventlist);
        })
        .catch(err => next(err));
}


function addParticipant(req, res, next) {
    let args = {
        role: req.body.role,
        overwrite: false
    };
    eventService.addParticipant(req, req.body.id, req.body.userId, args)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function changeParticipant(req, res, next) {
    let args = {
        role: req.body.role,
        overwrite: true,
    };
    eventService.addParticipant(req, req.body.id, req.body.userId, args)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function removeParticipant(req, res, next) {
    let args = {

    };
    eventService.removeParticipant(req, req.body.id, req.body.userId, args)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function populateParticipants(req, res, next) {
    eventService.populateParticipants(req.params.id)
        .then(function(event) {
            res.json(event);
        })
        .catch(err => {
            next(err);
        })
}

function _delete(req, res, next) {
    eventService.delete(req, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

