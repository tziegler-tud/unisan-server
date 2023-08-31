import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import passport from 'passport';
import bodyParser from "body-parser";
import userService from "../../services/userService.js";

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
          let redirectTo = req.session.redirectTo || "/";
          if(!user.privacyAgreement){
            redirectTo = "/privacyAgreement";
          }
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

router.get("/privacyAgreement", (req, res, next) => {
  if(!req.isAuthenticated()) {
    res.redirect('/login')
  }
  else {
    res.render("unisams/privacyAgreement", {title: "Privacy agreement - uniSams",
      user: req.user._doc,
    })
  }
});

router.get("/acceptPrivacyAgreement",  (req, res, next) => {
  if(!req.isAuthenticated()) {
    res.redirect('/login')
  }
  else {
    userService.setPrivacyAgreement(req, req.user.id, true)
        .then(result => {
          let redirectTo = "/";
          res.redirect(redirectTo)
        })
        .catch(err => next(err));
  }
});


router.get("/declinePrivacyAgreement",  (req, res, next) => {
  if(!req.isAuthenticated()) {
    res.redirect('/login')
  }
  else {
    userService.setPrivacyAgreement(req, req.user.id, false)
        .then(result => {
          res.redirect("/logout");
        })
        .catch(err => next(err));
    }
});




export default router;