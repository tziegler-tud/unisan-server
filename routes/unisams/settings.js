import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import userService from "../../services/userService.js";
import AclService from "../../services/aclService.js";
import AuthService from "../../services/authService.js";
import logService from '../../services/logService.js';
import userGroupService from "../../services/userGroupService.js";
import qualificationService from "../../services/qualificationService.js";
import Log from '../../utils/log.js';
import aclService from "../../services/aclService.js";


var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

function getDockerArguments (req, res, next) {
    AclService.getCurrentDocker(req.user._id)
        .then(docker => {
            req.acl = docker;
            next()
        })
    // req.docker = {};
    // next();
}

//hooked at /settings

/* GET home page. */
// router.get("/*", auth);
router.get("/*", getDockerArguments);
router.get("/", userSettingsIndexRoute);
router.get('/general', userSettingsGeneral);
router.get('/login', userSettingsLogin);
router.get('/mail', userSettingsMail);
router.get('/notifications', userSettingsNotifications);
router.get('/privacy', userSettingsPrivacy);

async function userSettingsIndexRoute (req, res, next) {
    res.redirect('/settings/login')
}


function userSettingsGeneral(req, res, next) {
    userService.getByUsername(req.user.username)
        .then(user => {
            res.render("unisams/settings/general", {
                user: req.user._doc,
                acl: req.acl,
                title: user.username + " | Einstellungen",
                refurl: req.params.username,
                allowedit: true
            })
        })
        .catch(err => next(err));
}


function userSettingsLogin(req, res, next) {
    userService.getByUsername(req.user.username)
        .then(user => {
            res.render("unisams/settings/login", {
                user: req.user._doc,
                acl: req.acl,
                title: user.username + " | Einstellungen",
                refurl: req.params.username,
                allowedit: true
            })
        })
        .catch(err => next(err));
}


function userSettingsMail(req, res, next) {
    userService.getByUsername(req.user.username)
        .then(user => {
            res.render("unisams/settings/mail", {
                user: req.user._doc,
                acl: req.acl,
                title: user.username + " | Einstellungen",
                refurl: req.params.username,
                allowedit: true
            })
        })
        .catch(err => next(err));
}


function userSettingsNotifications(req, res, next) {
    userService.getByUsername(req.user.username)
        .then(user => {
            res.render("unisams/settings/notifications", {
                user: req.user._doc,
                acl: req.acl,
                title: user.username + " | Einstellungen",
                refurl: req.params.username,
                allowedit: true
            })
        })
        .catch(err => next(err));
}


function userSettingsPrivacy(req, res, next) {
    userService.getByUsername(req.user.username)
        .then(user => {
            res.render("unisams/settings/privacy", {
                user: req.user._doc,
                acl: req.acl,
                title: user.username + " | Einstellungen",
                refurl: req.params.username,
                allowedit: true
            })
        })
        .catch(err => next(err));
}




export default router;