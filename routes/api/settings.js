var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const userService = require('../../services/userService');
const qualificationService = require('../../services/qualificationService');

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
    var qualList = {};
    qualificationService.getAll()
        .then(quals => {
            qualList = quals;
            res.render("unisams/settings", {title: "settings - uniSams",
                user: req.user._doc,
                qualificationList: qualList
            })
        })
        .catch(err => {
            next(err);
        })
});




module.exports = router;