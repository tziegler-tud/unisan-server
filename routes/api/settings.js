import express from 'express';
var router = express.Router();
import bodyParser from "body-parser";
import mailService from "../../services/mail/mailService.js";
import AuthService from "../../services/authService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//hooked at /api/v1/settings

// routes
router.put('/mail/setpassword', updateCurrentUserPassword);

function updateCurrentUserPassword(req, res, next){
    if (!req.body.password) {
        let err = {name: "ValidationError", message: "Invalid arguments given."}
        next(err);
    }
    let password = req.body.password;
    AuthService.checkUserWriteAccessCritical(req.user, req.user)
        .then(result => {
            mailService.updateUserPassword(req.user.internalEmail, password)
                .then(result => {
                    res.json({result: "OK"});
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err)
        })
}
export default router;
