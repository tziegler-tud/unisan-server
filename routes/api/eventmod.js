var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const eventService = require('../../services/eventService');
const uploadService = require('../../services/uploadService');


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


auth = function(req, res, next){
    if (!req.isAuthenticated()) {
        req.session.redirectTo = '/unisams';
        console.log("");
        res.redirect('/unisams/login');
    } else {
        next();
    }
};


// routes

// routes
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
router.delete('/:id', _delete);



module.exports = router;

function create(req, res, next) {
    eventService.create(req.body)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function getAll(req, res, next) {
    eventService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getById(req, res, next) {
    eventService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    eventService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function matchAny(req, res, next){
    if (req.body.filter === undefined) req.body.filter = "";
    eventService.matchAny(req.body.filter, req.body.args)
        .then(function(userlist) {
            res.json(userlist);
        })
        .catch(err => next(err));
}


function addParticipant(req, res, next) {
    let args = {
        role: req.body.role,
        overwrite: false
    };
    eventService.addParticipant(req.body.id, req.body.userId, args)
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
    eventService.addParticipant(req.body.id, req.body.userId, args)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function removeParticipant(req, res, next) {
    let args = {

    };
    eventService.removeParticipant(req.body.id, req.body.userId, args)
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
    eventService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
