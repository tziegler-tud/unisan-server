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

export default router;
