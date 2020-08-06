var express = require('express');
const router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const userService = require('../../services/userService');
const AuthService = require('../../services/authService');
const authService = new AuthService();

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


// routes
router.get('/', getAll);
router.get('/addUser', checkUrlAccess, addUser);
router.get('/edit/:username', checkUrlAccess, editUser);

router.get('/view/:username', viewUser);
router.get('/view/:username/logs', userLogs);
router.get('/view/:username/events', userEvents);

module.exports = router;


function checkUrlAccess(req, res, next){
    authService.checkUrlPermission(req.user,req.method,req.originalUrl)
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
    var userList = {};
    userService.getAll()
        .then(users => {
            userList = users;
            res.render("unisams/user/user", {title: "user managment - uniSams",
                user: req.user._doc,
                userList: userList
            })
        })
        .catch(err => {
            next(err);
        })
}

function addUser(req, res, next) {
    res.render("unisams/user/addUser", {
        title: "create user - uniSams",
        user: req.user._doc
    })
}

function viewUser(req, res, next) {
    userService.getByUsername(req.params.username)
        .then(user => {
            if (user) {
                res.render("unisams/user/profile", {
                    user: req.user._doc,
                    title: user.username,
                    exploreUser: user,
                    exploreUserDocument: user._doc,
                    refurl: req.params.username
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

}


function editUser(req, res, next) {
    userService.getByUsername(req.params.username)
        .then(user => {
            if (user) {
                res.render("unisams/user/editUser", {
                    user: req.user._doc,
                    title: user.username,
                    exploreUser: user,
                    exploreUserDocument: user._doc,
                    refurl: req.params.username
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

function userLogs(req, res, next) {
    userService.getByUsername(req.params.username)
        .then(user => {
            if (user) {
                res.render("unisams/user/logs", {
                    user: req.user._doc,
                    generalData: req.user._doc.generalData,
                    customData: req.user._doc.customData,
                    title: user.username,
                    exploreUser: user,
                    exploreUserDocument: user._doc,
                    refurl: req.params.username
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


function userEvents(req, res, next) {
    userService.getByUsername(req.params.username)
        .then(user => {
            if (user) {
                res.render("unisams/user/events", {
                    user: req.user._doc,
                    generalData: req.user._doc.generalData,
                    customData: req.user._doc.customData,
                    title: user.username,
                    exploreUser: user,
                    exploreUserDocument: user._doc,
                    refurl: req.params.username
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


