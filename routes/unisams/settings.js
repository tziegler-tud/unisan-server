var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const userService = require('../../services/userService');
const qualificationService = require('../../services/qualificationService');
const logService = require('../../services/logService');
const userGroupService = require('../../services/userGroupService');

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

//hooked at /unisams/settings

/* GET home page. */
router.get("/*", auth);
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
            res.render("unisams/settings/settings", {title: "settings - uniSams",
                user: req.user._doc,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
}

function user (req, res, next) {
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
}


function events (req, res, next) {
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
}


function roles (req, res, next) {
    userGroupService.getAll()
        .then(groups => {
            res.render("unisams/settings/roles", {title: "Rechte und Rollen - uniSams",
                user: req.user._doc,
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
                            group: group._doc,
                            assignedUser: user,
                        })
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
                            group: group._doc,
                            assignedUser: user,
                        })
                })

        })
        .catch(err => next(err))

}




module.exports = router;