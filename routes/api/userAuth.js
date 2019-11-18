var express = require('express');
var uuid = require('uuid');
const passport = require('passport');
var router = express.Router();
const bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

/* POST users listing. */

router.post('/userauth', function(req, res, next) {
    console.log('Inside POST /login callback');
    passport.authenticate('local', {}, (err, user, info) => {

        console.log('Inside passport.authenticate() callback');
        console.log('req.session.passport: ' + JSON.stringify(req.session.passport));
        console.log('req.user: ' + JSON.stringify(req.user));

        if (!user) { return res.redirect('/unisams/login'); }

        req.login(user, (err) => {

            console.log('Inside req.login() callback');
            console.log('req.session.passport:' + JSON.stringify(req.session.passport));
            console.log('req.user: ' + JSON.stringify(req.user));

            var redirectTo = req.session.redirectTo || "/unisams";
            res.redirect(redirectTo)
        })
    })(req, res, next);
});

router.get("/logout", function(req, res, next) {
  req.logout();
  res.redirect("/unisams");
});

module.exports = router;
