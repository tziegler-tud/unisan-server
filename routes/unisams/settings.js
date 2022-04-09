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

//hooked at /unisams/settings

/* GET home page. */
// router.get("/*", auth);
router.get("/*", getDockerArguments);
router.get('/', database);
router.get('/database', database);
router.get('/user', user);
router.get('/events', events);
router.get('/roles', roles);
router.get('/logs', logs);

router.get("/roles/:id/advanced", editRoleAdvanced);
router.get("/roles/:id", editRole);

function database (req, res, next) {
    var qualList = {};
    qualificationService.getAll()
        .then(quals => {
            qualList = quals;
            res.render("unisams/settings/settingsDatabase", {title: "settings - uniSams",
                user: req.user._doc,
                docker: req.docker,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
}

function user (req, res, next) {
    res.render("unisams/settings/user", {title: "settings - uniSams",
        user: req.user._doc,
        docker: req.docker,
    })
}


function events (req, res, next) {
    res.render("unisams/settings/events", {title: "settings - uniSams",
        user: req.user._doc,
        docker: req.docker,
    })
}


function roles (req, res, next) {
    userGroupService.getAll()
        .then(groups => {
            res.render("unisams/settings/roles", {title: "Rechte und Rollen - uniSams",
                user: req.user._doc,
                docker: req.docker,
                groups: groups
            })
        })
        .catch(err => {
            next(err);
        })
}


function logs (req, res, next) {
    res.render("unisams/settings/logs", {title: "logs - uniSams",
        user: req.user._doc,
        docker: req.docker,
    })
}

function editRole(req, res, next) {
    userGroupService.getById(req.params.id)
        .then(function(group){

            //get assigned user
            userGroupService.getAssignedUser(req.params.id)
                .then(function(user){
                    res.render("unisams/roles/role",
                        {
                            title: "Rolle: " + group.title,
                            user: req.user._doc,
                            docker: req.docker,
                            group: group._doc,
                            groupId: group._id,
                            assignedUser: user,
                        })
                })
                .catch(function(err){
                    next(next({status:404, message: err}));
                })

        })
        .catch(err => next(err))

}

function editRoleAdvanced(req, res, next) {
    userGroupService.getById(req.params.id)
        .then(function(group){

            //get assigned user
            userGroupService.getAssignedUser(req.params.id)
                .then(function(user){
                    res.render("unisams/roles/advanced",
                        {
                            title: "Rolle: " + group.title,
                            user: req.user._doc,
                            docker: req.docker,
                            group: group._doc,
                            groupId: group._id,
                            assignedUser: user,
                        })
                })
                .catch(function(err){
                    next(next({status:404, message: err}));
                })

        })
        .catch(err => next(err))

}




module.exports = router;