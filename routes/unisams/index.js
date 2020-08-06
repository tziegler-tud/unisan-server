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
    req.session.redirectTo = req.originalUrl;
    console.log("");
    res.redirect('/unisams/login');
  } else {
    next();
  }
};


/* GET pages. */
router.get('/', auth, function(req, res, next) {
    res.render("unisams/index", {title: "uniSams", user: req.user._doc})
});



module.exports = router;