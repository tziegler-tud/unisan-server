import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import userService from "../../services/userService.js";
import logService from "../../services/logService.js";
import mailService from "../../services/mail/mailService.js";
import UserService from "../../services/userService.js";
import req from "express/lib/request.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//hooked at /api/v1/mail

// routes
router.get('/user', getAll);
router.get('/user/:email', getUser);
router.post('/user/createUserAccount', createUserAccount);
router.post('/user/:username/sync', syncUserAccount);
router.put('/user/:email', updateUser);
router.put('/user/pasword/:email', updateUserPassword);

function getAll(req, res, next){
    mailService.getAll()
        .then(function(result){
            res.json(result.body)
        })
        .catch(err => next(err));
}

function getUser(req, res, next){
    mailService.getUser(req.params.email).json()
        .then(result => res.json(result))
        .catch(err => {
            next(err)
        });
}

function createUserAccount(req, res, next){
    const userid = req.body.userid;
    mailService.createAccountForUser(userid)
        .then(result => res.json(result.body))
        .catch(err => next(err));
}

function updateUser(req, res, next){
    mailService.updateUser(req.params.email, req.body)
        .then(result => res.json(result.body))
        .catch(err => next(err));
}

function updateUserPassword(req, res, next){
    mailService.updateUserPassword(req.params.email, req.body)
        .then(result => res.json(result.body))
        .catch(err => next(err));
}

async function syncUserAccount(req, res, next) {
    const user = await UserService.getByUsername(req.params.username)
    if(user) {
        res.json(await mailService.syncUserAccount(user));
    }
}

export default router;
