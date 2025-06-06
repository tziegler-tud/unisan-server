import express from 'express';
var router = express.Router();
import passport from 'passport';
import bodyParser from "body-parser";
import eventService from "../../services/eventService.js";
import AuthService from "../../services/authService.js";

import imageThumbnail from 'image-thumbnail';
import got from 'got';
import path from 'path';
import fs from 'fs-extra';

import upload from "../../config/multer.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.raw());

//hooked at /api/v1/eventfactory


function checkUrlAccess(req, res, next){
    AuthService.auth(req.user,req.method,req.originalUrl)
        .then(function(result){
            if(result){
                console.log("authorization successful!");
                next();
            }
            else {
                console.log("authorization failed!");
                res.status(403).send();
            }
        })
        .catch(err => next(err))
}



function checkEventReadRights(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.events.READ)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}

function checkEventEditRights(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.events.WRITE)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            // check individual rights
            eventService.getById(req.params.id)
                .then(ev => {
                    if (ev) {
                        AuthService.checkEventWriteAccess(req.user, ev, false)
                            .then(result => {
                                console.log("authorization successful!");
                                next();
                            })
                            .catch(err => {
                                // eventually fail
                                console.log("authorization failed!");
                                res.status(403).send();
                            })
                    }
                })
                .catch(err => next(err));
        })
}


function allowCreateEvent(req, res, next) {
    AuthService.auth(req.user, AuthService.operations.events.CREATE)
        .then(result =>{
            next();
        })
        .catch(err => {
            // eventually fail
            console.log("authorization failed!");
            res.status(403).send();
        })
}


router.post('/createBlueprint', allowCreateEvent, createBlueprint);

export default router;


function createBlueprint(req, res, next) {

}
