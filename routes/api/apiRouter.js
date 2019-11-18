var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");

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


router.get('/', auth, index);
router.get('/manageUser', auth, manageUser);
router.get('/profile', auth, profile);
router.get('/login', login);
router.get('/user', auth, user);
router.post('/userauth', userauth);
router.post('/logout', auth, userauth);

function index(req, res, next){
    res.render("unisams/index", {title: "uniSams", user: req.user._doc})
}

function manageUser(req,res,next){
    res.render("unisams/manageUser", {title: "user managment - uniSams", user: req.user._doc})
}

function login(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/unisams')
    } else {
        res.render('unisams/login', {title: 'uniSams login'});
    }
}

function profile(req,res,next){
    res.render("unisams/manageUser", {title: "user managment - uniSams", user: req.user._doc})
}


function user(req,res,next){
    next();
}

function userauth(req,res,next){
    next();
}


module.exports = router;