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

router.post('/auth', function(req, res, next) {
    console.log('Inside POST /login callback');
    passport.authenticate('local', {}, (err, user, info) => {
        if (!user) { return res.status(401).json({response: "login failed."}); }
        req.login(user, (err) => {
            res.status(200).json(user);
        })
    })(req, res, next);
});

router.all("/logout", function(req, res, next) {
  req.logout();
  res.status(200).send("Cya.");
});

module.exports = router;
