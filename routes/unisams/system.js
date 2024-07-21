import express from 'express';
var router = express.Router();
import bodyParser from "body-parser";
import AclService from "../../services/aclService.js";
import AuthService from "../../services/authService.js";
import userGroupService from "../../services/userGroupService.js";
import qualificationService from "../../services/qualificationService.js";


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


function checkSystemPermissions(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.system.SYSTEM)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next({status:403, message: "forbidden"});
        })
}

function getDockerArguments (req, res, next) {
    AclService.getCurrentDocker(req.user._id)
        .then(docker => {
            req.acl = docker;
            next()
        })
        .catch(err => {
            next({status: 500, message: "Internal Server Error"})
        })
}

//hooked at /system

/* GET home page. */
// router.get("/*", auth);
router.get("/*", getDockerArguments, checkSystemPermissions);
router.get('/', database);
router.get('/qualifications', qualifications);
router.get('/user', user);
router.get('/events', events);
router.get('/roles', roles);
router.get('/logs', logs);
router.get('/auth', authSettings);
router.get('/mail', mailSettings);
router.get('/dev', devSettings);

router.get("/roles/:id/advanced", editRoleAdvanced);
router.get("/roles/:id", editRole);

function database (req, res, next) {
    var qualList = {};
    qualificationService.getAll()
        .then(quals => {
            qualList = quals;
            res.render("unisams/system/settingsDatabase", {title: "System - unisanServer",
                user: req.user._doc,
                acl: req.acl,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
}

function qualifications (req, res, next) {
    var qualList = {};
    qualificationService.getAll()
        .then(quals => {
            qualList = quals;
            res.render("unisams/system/qualifications", {title: "qualifications - unisanServer",
                user: req.user._doc,
                acl: req.acl,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
}

function user (req, res, next) {
    res.render("unisams/system/user", {title: "system settings - unisanServer",
        user: req.user._doc,
        acl: req.acl,
    })
}


function events (req, res, next) {
    res.render("unisams/system/events", {title: "system settings - unisanServer",
        user: req.user._doc,
        acl: req.acl,
    })
}


function roles (req, res, next) {
    userGroupService.getAll()
        .then(groups => {
            res.render("unisams/system/roles", {title: "Rechte und Rollen - unisanServer",
                user: req.user._doc,
                acl: req.acl,
                groups: groups
            })
        })
        .catch(err => {
            next(err);
        })
}

function authSettings (req, res, next) {
    res.render("unisams/system/authentication", {
        title: "Authentifizierung - unisanServer",
        user: req.user._doc,
        acl: req.acl,
    })
}

function mailSettings (req, res, next) {
    res.render("unisams/system/mail", {
        title: "Email - unisanServer",
        user: req.user._doc,
        acl: req.acl,
    })
}

function devSettings (req, res, next) {
    res.render("unisams/system/development", {
        title: "Entwicklung - unisanServer",
        user: req.user._doc,
        acl: req.acl,
    })
}


function logs (req, res, next) {
    res.render("unisams/system/logs", {title: "logs - unisanServer",
        user: req.user._doc,
        acl: req.acl,
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
                            acl: req.acl,
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
                            acl: req.acl,
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




export default router;