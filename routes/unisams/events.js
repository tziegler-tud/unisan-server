import express from 'express';
var router = express.Router();
import bodyParser from "body-parser";
import eventService from "../../services/eventService.js";
import AuthService from "../../services/authService.js";
import AclService from "../../services/aclService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());



let auth = function(req, res, next){
    if (!req.isAuthenticated()) {
        req.session.redirectTo = '/';
        console.log("");
        res.redirect('/login');
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
                                    reject({status:403, message: "forbidden"});
                                })
                        }
                    })
                    .catch(err => reject({status:404, message: "not found"}));
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
        .then(dockerAcl => {
            req.acl = dockerAcl;
            next()
        })
}


// routes
//hooked at /events
const baseUrl = "/events";

//check url access by user group
// router.use('/*', auth);
router.use('/*', getDockerArguments);
// routes
router.get('/', checkEventReadRights, eventOverview);
router.get('/all', checkEventReadRights, getAll);
router.get('/upcoming', checkEventReadRights, getUpcoming);
router.get('/past', checkEventReadRights, getPast);

router.get('/addEvent', allowCreateEvent, addEvent);

router.get('/*', checkEventReadRights)
router.get('/:id/logs', checkEventEditRights, eventLogs);

router.get('/:id', eventDetails);
router.get('/:id/participants', eventParticipants);
router.get('/:id/postings', eventPostings);
router.get('/:id/settings', eventSettings);
router.get('/:id/files/:filename', eventFileDownloader);


/* legacy */

router.get('/view/:id', legacyRedirect);
router.get('/view/:id/:url', legacyRedirect);
router.get('/edit/:id', legacyRedirect);
router.get('/edit/:id/:url', legacyRedirect);

// router.get('/edit/:id', auth, checkEventEditRights, editEvent);
//
// router.get('/view/:id/logs', checkEventEditRights, eventLogs);
//
// router.get('/view/*', checkEventReadRights)
// router.get('/view/:id', viewEvent);
// router.get('/view/:id/participants', eventParticipants);
// router.get('/view/:id/files/:filename', eventFileDownloader);



export default router;

function legacyRedirect(req, res, next){
    var newPath = baseUrl + "/" + req.params.id;
    if (req.params.url) newPath = newPath + "/" + req.params.url;
    res.redirect(newPath);
}

/* GET home page. */
function eventOverview(req, res, next) {
    var eventList = {};
    eventService.getAll()
        .then(events => {
            eventList = events;
            res.render("unisams/events/eventOverview", {title: "Events - uniSams",
                user: req.user._doc,
                pageHeader: "Alle Events",
                eventList: eventList,
                acl: req.acl,
                allowedit: false,
                dockerArgs: {activeContainer: "eventContainer", activeElementId: "eventsAll"}

            })
        })
        .catch(err => {
            next(err);
        })
}

function getAll(req, res, next) {
    var eventList = {};
    eventService.getAll()
        .then(events => {
            eventList = events;
            res.render("unisams/events/eventlist", {title: "Events - uniSams",
                user: req.user._doc,
                pageHeader: "Alle Events",
                eventList: eventList,
                acl: req.acl,
                allowedit: false,
                dockerArgs: {activeContainer: "eventContainer", activeElementId: "eventsAll"}

            })
        })
        .catch(err => {
            next(err);
        })
}

function getUpcoming(req, res, next) {

    res.render("unisams/events/eventlist", {title: "Events - uniSams",
        user: req.user._doc,
        dateFilter: "upcoming",
        pageHeader: "Bevorstehende Events",
        dockerSection: "eventsUpcoming",
        acl: req.acl,
        dockerArgs: {activeContainer: "eventContainer", activeElementId: "eventsUpcoming"}
    })
}

function getPast(req, res, next) {
    res.render("unisams/events/eventlist", {title: "Events - uniSams",
        user: req.user._doc,
        dateFilter: "past",
        pageHeader: "Vergangene Events",
        dockerSection: "eventsPast",
        acl: req.acl,
        dockerArgs: {activeContainer: "eventContainer", activeElementId: "eventsPast"}

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
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                //check if editing this event is allowed
                checkEventEditRightsPromise(req, res, next)
                    .then(result => {
                        res.render("unisams/events/editEvent", {
                            user: req.user._doc,
                            acl: req.acl,
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
    eventService.getById(req.params.id)
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

function eventParticipants(req, res, next) {
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                //check if editing this user is allowed
                let url = "unisams/events/participants";
                checkEventEditRightsPromise(req, res, next)
                    .then(result => {
                        url = "unisams/events/participants";
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
                        let url = "unisams/events/participants";
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

function eventPostings(req, res, next) {
    eventService.getById(req.params.id)
        .then(ev => {
            if (ev) {
                //check if editing this user is allowed
                let url = "unisams/events/participants";
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
                let url = "unisams/events/settings";
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
                res.render("unisams/events/logs", {
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

function eventFileDownloader(req, res, next){
    res.redirect('/api/v1/eventmod' + req.params.id + "/files/" + req.filename);
}

