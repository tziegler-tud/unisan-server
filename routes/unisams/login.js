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

router.get('/login', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/unisams')
  } else {
    res.render('unisams/login', { title: 'uniSams login' });
  }
});

/* POST user login */
router.post('/login', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/unisams')
  } else {
    passport.authenticate('local', {}, (err, user, info) => {
      if (!user) { return res.redirect("/unisams/login"); }
      req.login(user, {}, (err) => {
        //passport.js race condition bug requires you to save the session explicitly before redirecting.
        req.session.save(function(){
          var redirectTo = req.session.redirectTo || "/unisams";
          res.redirect(redirectTo);
        })

      })
    })(req, res, next);
  }
});

router.all("/logout", function(req, res, next) {
  req.logout();
  req.session.destroy(function(err){
    res.redirect("/unisams");
  })

});



module.exports = router;