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
router.get('/', userSettings);



function userSettings(req, res, next) {
    userService.getByUsername(req.user.username)
        .then(user => {
            res.render("unisams/settings/settings", {
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