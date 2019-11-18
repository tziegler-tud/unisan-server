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


/* GET pages. */
router.get('/', auth, function(req, res, next) {

    res.render("unisams/index", {title: "uniSams", user: req.user._doc})

});

router.get('/login', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/unisams')
  } else {
    res.render('unisams/login', { title: 'uniSams login' });
  }
});


/* POST user login */
router.post('/userauth', function(req, res, next) {
  console.log('Inside POST /login callback');
  passport.authenticate('local', {}, (err, user, info) => {

    console.log('Inside passport.authenticate() callback');
    console.log('req.session.passport: ' + JSON.stringify(req.session.passport));
    console.log('req.user: ' + JSON.stringify(req.user));

    req.login(user, (err) => {

      console.log('Inside req.login() callback');
      console.log('req.session.passport:' + JSON.stringify(req.session.passport));
      console.log('req.user: ' + JSON.stringify(req.user));

      var redirectTo = req.session.redirectTo || "/";
      res.redirect(redirectTo)
    })
  })(req, res, next);
});



module.exports = router;