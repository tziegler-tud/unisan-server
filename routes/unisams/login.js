import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import passport from 'passport';
import bodyParser from "body-parser";

var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

router.get('/login', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/')
  } else {
    res.render('unisams/login', { title: 'uniSams login' });
  }
});

/* POST user login */
router.post('/login', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/')
  } else {
    passport.authenticate('local', {}, (err, user, info) => {
      if (!user) { return res.redirect("/login"); }
      req.login(user, {}, (err) => {
        //passport.js race condition bug requires you to save the session explicitly before redirecting.
        req.session.save(function(){
          var redirectTo = req.session.redirectTo || "/";
          res.redirect(redirectTo);
        })

      })
    })(req, res, next);
  }
});

router.all("/logout", function(req, res, next) {
  req.logout();
  req.session.destroy(function(err){
    res.redirect("/");
  })

});



export default router;