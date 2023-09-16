import express from 'express';
var router = express.Router();
import bodyParser from "body-parser";
import userService from "../../services/userService.js";
import qualificationService from "../../services/qualificationService.js";
import logService from '../../services/logService.js';
import userGroupService from "../../services/userGroupService.js";
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

function getDockerArguments (req, res, next) {
    AclService.getCurrentDocker(req.user._id)
        .then(docker => {
            req.acl = docker;
            next()
        })
    // req.docker = {};
    // next();
}

//hooked at /dashboard

/* GET home page. */
// router.get("/*", auth);
router.get("/*", getDockerArguments);
router.get('/', dashboard);
router.get('/events', dashboardEvents);
router.get('/activity', dashboardActivity);
router.get('/news/add', addNewsEntry);
router.get('/news', dashboardNews);
function dashboard (req, res, next) {
    res.render("unisams/dashboard/dashboard", {title: "Dashboard - uniSams",
        user: req.user._doc,
        acl: req.acl,
    })
}

function dashboardEvents (req, res, next) {
    res.render("unisams/dashboard/events", {title: "Meine Events - uniSams",
        user: req.user._doc,
        acl: req.acl,
    })
}


function dashboardActivity (req, res, next) {
    res.render("unisams/dashboard/activity", {title: "Aktivität - uniSams",
        user: req.user._doc,
        acl: req.acl,
    })
}

function dashboardNews (req, res, next) {
    res.render("unisams/dashboard/news", {title: "News - uniSams",
        user: req.user._doc,
        acl: req.acl,
    })
}

function addNewsEntry (req, res, next) {
    res.render("unisams/news/add", {title: "News - uniSams",
        user: req.user._doc,
        acl: req.acl,
    })
}



export default router;