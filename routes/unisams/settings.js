var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const userService = require('../../services/userService');
const qualificationService = require('../../services/qualificationService');
const logService = require('../../services/logService');

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


/* GET home page. */
router.get('/', auth, function(req, res, next) {
    var qualList = {};
    qualificationService.getAll()
        .then(quals => {
            qualList = quals;
            res.render("unisams/settings/settings", {title: "settings - uniSams",
                user: req.user._doc,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
});

/* GET database settings page. */
router.get('/database', auth, function(req, res, next) {
    var qualList = {};
    qualificationService.getAll()
        .then(quals => {
            qualList = quals;
            res.render("unisams/settings/settingsDatabase", {title: "database settings - uniSams",
                user: req.user._doc,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
});

/* GET user settings page. */
router.get('/user', auth, function(req, res, next) {
    var qualList = {};
    qualificationService.getAll()
        .then(quals => {
            qualList = quals;
            res.render("unisams/settings/settingsUser", {title: "user settings - uniSams",
                user: req.user._doc,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
});

/* GET user settings page. */
router.get('/events', auth, function(req, res, next) {
    var qualList = {};
    qualificationService.getAll()
        .then(quals => {
            qualList = quals;
            res.render("unisams/settings/settingsEvents", {title: "event settings - uniSams",
                user: req.user._doc,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
});

router.get('/logs', auth, function(req, res, next) {
    res.render("unisams/settings/logs", {title: "logs - uniSams",
        user: req.user._doc,
    })
});





module.exports = router;