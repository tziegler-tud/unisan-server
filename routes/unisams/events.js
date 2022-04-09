var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const eventService = require('../../services/eventService');
const AuthService = require ("../../services/authService");
const AclService = require ("../../services/aclService");

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
    AuthService.auth(req.user,AuthService.operations.events.READ)
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



function checkEventReadRights(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.events.READ)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}

function checkEventEditRights(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.events.WRITE)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            // check individual rights
            eventService.getById(req.params.id)
                .then(ev => {
                    if (ev) {
                        AuthService.checkEventWriteAccess(req.user, ev, false)
                            .then(result => {
                                console.log("authorization successful!");
                                next();
                            })
                            .catch(err => {
                                // eventually fail
                                console.log("authorization failed!");
                                next({status:403, message: "forbidden"});
                            })
                    }
                })
                .catch(err => next(err));
        })
}

function checkEventEditRightsPromise(req, res, next){
    // check group permissions
    return new Promise(function(resolve, reject) {
        AuthService.auth(req.user, AuthService.operations.events.WRITE)
            .then(function(result) {
                resolve();
            })
            .catch(err => {
                // check individual rights
                eventService.getById(req.params.id)
                    .then(ev => {
                        if (ev) {
                            AuthService.checkEventWriteAccess(req.user, ev, false)
                                .then(result => {
                                    resolve();
                                })
                                .catch(err => {
                                    reject();
                                })
                        }
                    })
                    .catch(err => reject());
            })
    });
}



function checkParticipantAccess (req, res, next) {
    //check if trying to add self
    if (req.user.id === req.body.userId) {
        //allow operation
        next()
    }
    else {
        //if not modifying self, editing rights are required
        req.params.id = req.body.id;
        checkEventEditRights(req, res, next);
    }
}

function allowCreateEvent(req, res, next) {
    AuthService.auth(req.user, AuthService.operations.events.CREATE)
        .then(result =>{
            next();
        })
        .catch(err => {
            // eventually fail
            console.log("authorization failed!");
            next({status:403, message: "forbidden"});
        })
}

function getDockerArguments (req, res, next) {
    AclService.getCurrentDocker(req.user._id)
        .then(docker => {
            req.docker = docker;
            next()
        })
}


// routes
//check url access by user group
router.use('/*', auth);
router.use('/*', getDockerArguments);
// routes
router.get('/', checkEventReadRights, getAll);

router.get('/addEvent', allowCreateEvent, addEvent);

router.get('/edit/:id', auth, checkEventEditRights, editEvent);
router.get('/view/:id/logs', checkEventEditRights, eventLogs);

router.get('/view/*', checkEventReadRights)
router.get('/view/:id', viewEvent);
router.get('/view/:id/participants', eventParticipants);
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
                docker: req.docker,
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
        docker: req.docker,
        user: req.user._doc
    })
}

function viewEvent(req, res, next) {
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                //check if editing this user is allowed
                checkEventEditRightsPromise(req, res, next)
                    .then(result => {
                        res.render("unisams/events/viewEvent", {
                            user: req.user._doc,
                            docker: req.docker,
                            title: ev.title.value,
                            exploreEvent: ev,
                            refurl: req.params.id,
                            allowedit: true,
                        })
                    })
                    .catch(err => {
                        res.render("unisams/events/viewEvent", {
                            user: req.user._doc,
                            title: ev.title.value,
                            exploreEvent: ev,
                            refurl: req.params.id,
                            allowedit: false,
                        })
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
                    docker: req.docker,
                    title: event.title.value,
                    exploreEvent: event,
                    refurl: req.params.id,
                    allowedit: true,
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
                checkEventEditRightsPromise(req, res, next)
                    .then(result => {
                        url = "unisams/events/editParticipants";
                        res.render(url, {
                            user: req.user.toJSON(),
                            docker: req.docker,
                            title: ev.title.value,
                            exploreEvent: ev,
                            exploreEventDocument: ev._doc,
                            allowedit: true,
                        })
                    })
                    .catch(err => {
                        let url = "unisams/events/participants";
                        res.render(url, {
                            user: req.user.toJSON(),
                            docker: req.docker,
                            title: ev.title.value,
                            exploreEvent: ev,
                            exploreEventDocument: ev._doc,
                            allowedit: false,
                        })
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
                    docker: req.docker,
                    title: ev.title.value,
                    exploreEvent: ev,
                    exploreEventDocument: ev._doc,
                    allowedit: true
                })
            }
        })
        .catch(err => next(err));

}

function eventFileDownloader(req, res, next){
    res.redirect('/api/v1/eventmod' + req.params.id + "/files/" + req.filename);
}

