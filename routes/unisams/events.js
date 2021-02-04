var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const eventService = require('../../services/eventService');
const AuthService = require ("../../services/authService");

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());



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
    AuthService.checkUrlPermission(req.user,req.method,req.originalUrl)
        .then(function(result){
            if(result){
                console.log("authorization successful!");
                next();
            }
            else {
                console.log("authorization failed!");
                next({status:403, message: "forbidden"});
            }
        })
        .catch(err => next(err))
}

function checkEventEditRights(req, res, next){
    // check group permissions
    AuthService.checkUrlPermission(req.user,req.method,req.originalUrl)
        .then(function(result){
            if(result){
                console.log("authorization successful!");
                next();
            }
            else {
                // check individual rights
                eventService.getById(req.params.id)
                    .then(ev => {
                        if (ev) {
                            if (AuthService.checkIfEdit(req.user, ev, "event")) {
                                console.log("authorization successful!");
                                next();
                            }
                            else {
                                // eventually fail
                                console.log("authorization failed!");
                                next({status:403, message: "forbidden"});
                            }
                        }
                    })
                    .catch(err => next(err));
            }
        })
        .catch(err => next(err))
}


// routes

router.get('/edit/:id', auth, checkEventEditRights, editEvent);
//check url access by user group
router.use('/*', auth, checkUrlAccess);
// routes
router.get('/', getAll);
router.get('/addEvent', addEvent);
router.get('/view/:id', viewEvent);
router.get('/view/:id/participants', eventParticipants);
router.get('/view/:id/logs', eventLogs);
router.get('/view/:id/files/:filename', eventFileDownloader);



module.exports = router;

/* GET home page. */
function getAll(req, res, next) {
    var eventList = {};
    eventService.getAll()
        .then(events => {
            eventList = events;
            res.render("unisams/events/eventlist", {title: "user managment - uniSams",
                user: req.user._doc,
                eventList: eventList
            })
        })
        .catch(err => {
            next(err);
        })
}

function addEvent(req, res, next) {
    res.render("unisams/events/addEvent", {
        title: "create Event - uniSams",
        user: req.user._doc
    })
}

function viewEvent(req, res, next) {
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                //check if editing this user is allowed
                let edit = AuthService.checkIfEdit(req.user, ev, "event");
                res.render("unisams/events/viewEvent", {
                    user: req.user._doc,
                    title: ev.title.value,
                    exploreEvent: ev,
                    refurl: req.params.id,
                    allowedit: edit,
                })
            }
        })
        .catch(err => next(err));
}

function editEvent(req, res, next) {
    eventService.getById(req.params.id)
        .then(event => {
            if (event) {
                res.render("unisams/events/editEvent", {
                    user: req.user._doc,
                    title: event.title.value,
                    exploreEvent: event,
                    refurl: req.params.id
                })
            }
        })
        .catch(err => next(err));
}

function eventParticipants(req, res, next) {
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                //check if editing this user is allowed
                let url = "unisams/events/participants";
                let edit = AuthService.checkIfEdit(req.user, ev, "event");
                if (edit) {
                    url = "unisams/events/editParticipants"
                }
                res.render(url, {
                    user: req.user.toJSON(),
                    title: ev.title.value,
                    exploreEvent: ev,
                    exploreEventDocument: ev._doc,
                    allowedit: edit,
                })
            }
        })
        .catch(err => next(err));
}


function eventLogs(req, res, next) {
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                res.render("unisams/events/logs", {
                    user: req.user._doc,
                    title: ev.title.value,
                    exploreEvent: ev,
                    exploreEventDocument: ev._doc,
                })
            }
        })
        .catch(err => next(err));

}

function eventFileDownloader(req, res, next){
    res.redirect('/api/v1/eventmod' + req.params.id + "/files/" + req.filename);
}

