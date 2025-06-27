import express from 'express';
var router = express.Router();
import bodyParser from "body-parser";
import eventService from "../../services/eventService.js";
import AuthService from "../../services/authService.js";
import AclService from "../../services/aclService.js";
import EventFactoryService from "../../services/eventFactoryService.js";
import eventFactoryService from "../../services/eventFactoryService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


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
        .catch(err => next(err));
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
                                    reject({status:403, message: "forbidden"});
                                })
                        }
                    })
                    .catch(err => reject({status:404, message: "not found"}));
            })
    });
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
        .then(dockerAcl => {
            req.acl = dockerAcl;
            next()
        })
}


// routes
//hooked at /eventfactory
const baseUrl = "/eventfactory";

//check url access by user group
// router.use('/*', auth);
router.use('/*', getDockerArguments);
// routes
router.get('/', checkEventReadRights, eventOverview);

router.get('/addEvent', allowCreateEvent, addEvent);

router.get('/*', checkEventReadRights)
router.get('/:id/logs', checkEventEditRights, eventLogs);

router.get('/:id', eventDetails);
router.get('/:id/participants', eventPostings);
router.get('/:id/postings', eventPostings);
router.get('/:id/settings', eventSettings);


export default router;

/* GET home page. */
function eventOverview(req, res, next) {
    res.render("unisams/eventFactory/overview", {title: "Event-Vorlagen - uniSams",
        user: req.user._doc,
        pageHeader: "Eventvorlagen",
        acl: req.acl,
        allowedit: false,
        dockerArgs: {activeContainer: "eventContainer", activeElementId: "eventsOverview"}

    })
}

function addEvent(req, res, next) {
    res.render("unisams/events/addEvent", {
        title: "create Event - uniSams",
        acl: req.acl,
        user: req.user._doc
    })
}

function eventDetails(req, res, next) {
    EventFactoryService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                res.render("unisams/eventFactory/editEvent", {
                    user: req.user._doc,
                    acl: req.acl,
                    title: ev.title.value,
                    exploreEvent: ev,
                    refurl: req.params.id,
                    allowedit: true,
                })
            }
            else {
                //event not found
                next({status:404, message: "Event not found"});
            }
        })
        .catch(err => {
            next(err)
        });
}

function editEvent(req, res, next) {
    EventService.getById(req.params.id)
        .then(event => {
            if (event) {
                res.render("unisams/events/editEvent", {
                    user: req.user._doc,
                    acl: req.acl,
                    title: event.title.value,
                    exploreEvent: event,
                    refurl: req.params.id,
                    allowedit: true,
                })
            }
        })
        .catch(err => next(err));
}

function eventPostings(req, res, next) {
    EventFactoryService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                //check if editing this user is allowed
                let url = "unisams/eventFactory/postings";
                checkEventEditRightsPromise(req, res, next)
                    .then(result => {
                        res.render(url, {
                            user: req.user.toJSON(),
                            acl: req.acl,
                            title: ev.title.value,
                            exploreEvent: ev,
                            exploreEventDocument: ev._doc,
                            allowedit: true,
                        })
                    })
                    .catch(err => {
                        res.render(url, {
                            user: req.user.toJSON(),
                            acl: req.acl,
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

function eventSettings(req, res, next) {
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                //check if editing this user is allowed
                let url = "unisams/eventfactory/settings";
                checkEventEditRightsPromise(req, res, next)
                    .then(result => {
                        res.render(url, {
                            user: req.user.toJSON(),
                            acl: req.acl,
                            title: ev.title.value,
                            exploreEvent: ev,
                            exploreEventDocument: ev._doc,
                            allowedit: true,
                        })
                    })
                    .catch(err => {
                        next(err)
                    })
            }
        })
        .catch(err => next(err));
}

function eventLogs(req, res, next) {
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                res.render("unisams/eventfactory/logs", {
                    user: req.user._doc,
                    acl: req.acl,
                    title: ev.title.value,
                    exploreEvent: ev,
                    exploreEventDocument: ev._doc,
                    allowedit: true
                })
            }
        })
        .catch(err => next(err));

}

