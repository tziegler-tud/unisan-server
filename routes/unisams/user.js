var express = require('express');
const router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const userService = require('../../services/userService');
const AuthService = require('../../services/authService');
const aclService = require('../../services/aclService');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

function getDockerArguments (req, res, next) {
    aclService.getCurrentDocker(req.user._id)
        .then(docker => {
            req.acl = docker;
            next()
        })
    // req.docker = {};
    // next();
}


//hooked at /unisams/user
const baseUrl = "/unisams/user";

// routes
router.get("/*", getDockerArguments)
router.get('/', getAll);
router.get('/addUser', addUser);

/*
legacy api call redirect
 */

router.get("/view/:username", legacyRedirect);
router.get("/view/:username/:url", legacyRedirect);
router.get("/edit/:username", legacyRedirect);
router.get("/edit/:username/:url", legacyRedirect);

router.get('/:username', profile);
router.get('/:username/logs', userLogs);
router.get('/:username/settings', userSettings);
router.get('/:username/roles', userRoles);
router.get('/:username/events', userEvents);
//


module.exports = router;

function legacyRedirect(req, res, next) {
    var newPath = baseUrl + "/" + req.params.username;
    if (req.params.url) newPath = newPath + "/" + req.params.url;
    res.redirect(newPath);
}


function checkUrlAccess(req, res, next){
    AuthService.auth(req.user,AuthService.operations.user.READ)
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

/* GET home page. */
function getAll(req, res, next) {
    AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.READ)
        .then(result => {
            var userList = {};
            userService.getAll()
                .then(users => {
                    userList = users;
                    res.render("unisams/user/user", {title: "user managment - uniSams",
                        user: req.user._doc,
                        acl: req.acl,
                        userList: userList
                    })
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => next(err));
}

function addUser(req, res, next) {
    AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.CREATE)
        .then(result => {
            res.render("unisams/user/addUser", {
                title: "create user - uniSams",
                acl: req.acl,
                user: req.user._doc
            })
        })
        .catch(err =>  next(err))

}

function profile(req, res, next) {
    AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.READ)
        .then(result => {
            userService.getByUsername(req.params.username)
                .then(user => {
                    aclService.getUserACL(user.id, true)
                        .then(userACL => {
                            if (user) {
                                //build docker arguments
                                let docker = userACL.docker;
                                AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.WRITE)
                                    .then(result => {
                                        res.render("unisams/user/editUser", {
                                            user: req.user._doc,
                                            userrole: userACL.userRole,
                                            usergroups: userACL.userGroups,
                                            title: user.username,
                                            exploreUser: user,
                                            exploreUserDocument: user._doc,
                                            refurl: req.params.username,
                                            acl: req.acl,
                                            allowedit: true,
                                        })
                                    })
                                    .catch(err=> {
                                        res.render("unisams/user/profile", {
                                            user: req.user._doc,
                                            userrole: userACL.userRole,
                                            usergroups: userACL.userGroups,
                                            title: user.username,
                                            exploreUser: user,
                                            exploreUserDocument: user._doc,
                                            refurl: req.params.username,
                                            acl: req.acl,
                                            allowedit: false,
                                        })
                                    })

                            }
                            else {
                                // try if id was given
                                userService.getById(req.params.username)
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
                        .catch(err=> next(err));
                        })
                        .catch(err => next(err))

        })
        .catch(err => next(err))
}

function userLogs(req, res, next) {
    userService.getByUsername(req.params.username)
        .then(user => {
            if (user) {
                //check if editing this user is allowed
                let edit = AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.WRITE)
                    .then(result => {
                        res.render("unisams/user/logs", {
                            user: req.user._doc,
                            acl: req.acl,
                            generalData: req.user._doc.generalData,
                            customData: req.user._doc.customData,
                            title: user.username,
                            exploreUser: user,
                            exploreUserDocument: user._doc,
                            refurl: req.params.username,
                            allowedit: true,
                        })
                    })
                    .catch(err => next(err))
            }
            else {
                // try if id was given
                userService.getById(req.params.username)
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


function userEvents(req, res, next) {
    AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.READ)
        .then(result => {
            userService.getByUsername(req.params.username)
                .then(user => {
                    if (user) {
                        //check if editing this user is allowed
                        AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.WRITE)
                            .then(result => {
                                res.render("unisams/user/events", {
                                    user: req.user._doc,
                                    acl: req.acl,
                                    generalData: req.user._doc.generalData,
                                    customData: req.user._doc.customData,
                                    title: user.username,
                                    exploreUser: user,
                                    exploreUserDocument: user._doc,
                                    refurl: req.params.username,
                                    allowedit: true,
                                })
                            })
                            .catch(err=> {
                                res.render("unisams/user/events", {
                                    user: req.user._doc,
                                    acl: req.acl,
                                    generalData: req.user._doc.generalData,
                                    customData: req.user._doc.customData,
                                    title: user.username,
                                    exploreUser: user,
                                    exploreUserDocument: user._doc,
                                    refurl: req.params.username,
                                    allowedit: false
                                })
                            })
                    }
                    else {
                        // try if id was given
                        userService.getById(req.params.username)
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
        })
        .catch(err => next(err))


}

function userSettings(req, res, next) {
    userService.getByUsername(req.params.username)
        .then(user => {
            if (user) {
                //check if editing this user is allowed
                AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.WRITE)
                    .then(result => {
                        res.render("unisams/user/settings", {
                            user: req.user._doc,
                            acl: req.acl,
                            title: user.username + " | Einstellungen",
                            exploreUser: user,
                            exploreUserDocument: user._doc,
                            refurl: req.params.username,
                            allowedit: true
                        })
                    })
                    .catch(err=> {
                        var newPath = baseUrl + "/" + user.username;
                        res.redirect(newPath);
                    })

            }
            else {
                // try if id was given
                userService.getById(req.params.username)
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

function userRoles(req, res, next) {
    AuthService.checkAllowedGroupOperation(req.user, AuthService.operations.user.WRITE)
        .then(result => {
            userService.getByUsername(req.params.username)
                .then(user => {
                    aclService.getUserACL(user.id, true)
                        .then(userACL => {
                            if (user) {
                                res.render("unisams/user/roles", {
                                    user: req.user._doc,
                                    acl: req.acl,
                                    title: user.username + " | Rechte & Rollen",
                                    exploreUser: user,
                                    exploreUserDocument: user.toJSON(),
                                    userACL: userACL,
                                    userrole: userACL.userRole,
                                    usergroups: userACL.userGroups,
                                    individual: userACL.individual,
                                    refurl: req.params.username,
                                    allowedit: true
                                })
                            } else {
                                // try if id was given
                                userService.getById(req.params.username)
                                    .then(user => {
                                        if (user) {
                                            var newPath = req.originalUrl.replace(user.id, user.username);
                                            res.redirect(newPath);
                                        } else {
                                            //give up
                                            res.send("user not found");
                                        }
                                    })
                                    .catch(err => next(err));
                            }
                        })
                        .catch(err => next(err));
                })
                .catch(err => next(err))
        })
        .catch(err => next(err))
}
