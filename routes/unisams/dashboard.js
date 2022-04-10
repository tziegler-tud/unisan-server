var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const userService = require('../../services/userService');
const qualificationService = require('../../services/qualificationService');
const logService = require('../../services/logService');
const userGroupService = require('../../services/userGroupService');
const AclService = require("../../services/aclService");

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

function getDockerArguments (req, res, next) {
    AclService.getCurrentDocker(req.user._id)
        .then(docker => {
            req.docker = docker;
            next()
        })
    // req.docker = {};
    // next();
}

//hooked at /unisams/dashboard

/* GET home page. */
// router.get("/*", auth);
router.get("/*", getDockerArguments);
router.get('/', dashboard);
router.get('/events', dashboardEvents);
router.get('/notifications', dashboardNotifications);
function dashboard (req, res, next) {
    res.render("unisams/dashboard/dashboard", {title: "Dashboard - uniSams",
        user: req.user._doc,
        docker: req.docker,
    })
}

function dashboardEvents (req, res, next) {
    res.render("unisams/dashboard/events", {title: "Meine Events - uniSams",
        user: req.user._doc,
        docker: req.docker,
    })
}


function dashboardNotifications (req, res, next) {
    res.render("unisams/dashboard/notifications", {title: "Benachrichtigungen - uniSams",
        user: req.user._doc,
        docker: req.docker,
    })
}




module.exports = router;