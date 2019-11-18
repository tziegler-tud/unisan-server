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


/* GET home page. */
router.get('/', auth, function(req, res, next) {
    var userList = {};
    userService.getAll()
        .then(users => {
            userList = users;
            res.render("unisams/user", {title: "user managment - uniSams",
                user: req.user._doc,
                userList: userList
            })
        })
        .catch(err => {
            next(err);
        })
});

router.get('/addUser', auth, function(req, res, next) {

    res.render("unisams/user/addUser", {
        title: "create user - uniSams",
        user: req.user._doc
    })

});


router.get("/:username", auth, function(req, res, next) {
    userService.getByUsername(req.params.username)
        .then(user => {
            if (user) {
                res.render("unisams/user/profile", {
                    user: req.user._doc,
                    title: user.username,
                    exploreUser: user,
                    refurl: req.params.username
                })
            }
            else res.send("user not found");
        })
        .catch(err => next(err));

});

router.get("/:username/editUser", auth, function(req, res, next) {
    userService.getByUsername(req.params.username)
        .then(user => {
            if (user) {
                res.render("unisams/user/edit", {
                    user: req.user._doc,
                    title: user.username,
                    exploreUser: user,
                    refurl: req.params.username
                })
            }
            else res.send("user not found");
        })
        .catch(err => next(err));

});






module.exports = router;