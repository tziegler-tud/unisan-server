import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import userService from "../../services/userService.js";
import logService from "../../services/logService.js";
import mailService from "../../services/mail/mailService.js";
import UserService from "../../services/userService.js";
import req from "express/lib/request.js";
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
    AuthService.checkUserWriteAccess(req.user, "self", true)
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

        })
}
export default router;
