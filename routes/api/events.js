var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const eventService = require('../../services/eventService');

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


// routes

router.get('/',  auth, getAll);
router.get('/addEvent', auth, addEvent);
router.get('/:id', auth, viewEvent);
router.get('/:id/editUser', auth, editEvent);


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
                res.render("unisams/events/viewEvent", {
                    user: req.user._doc,
                    title: ev.title.value,
                    exploreEvent: ev,
                    exploreEventDocument: ev._doc,
                })
            }
        })
        .catch(err => next(err));
}

function editEvent(req, res, next) {
    eventService.getById(req.params.id)
        .then(user => {
            if (user) {
                res.render("unisams/events/editEvent", {
                    user: req.user._doc,
                    title: user.username,
                    exploreUser: user,
                    exploreUserDocument: user._doc,
                    refurl: req.params.username
                })
            }
            else {
                // try if id was given
                eventService.getById(req.params.username)
                    .then(user => {
                        if (user) {
                            var newPath = req.originalUrl.replace(user.id, user.username);
                            res.redirect(newPath);
                        } else {
                            //give up
                            res.send("user not found");
                        }
                    })
                    .catch(err=> next(err));
            }
        })
        .catch(err => next(err));
}

