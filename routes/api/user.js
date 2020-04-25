var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const userService = require('../../services/userService');

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


// routes

router.get('/',  auth, getAll);
router.get('/addUser', auth, addUser);
router.get('/:username', auth, viewUser);
router.get('/:username/editUser', auth, editUser);



module.exports = router;

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


