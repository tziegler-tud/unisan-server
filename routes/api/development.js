import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import eventService from "../../services/eventService.js";
import newsService from "../../services/NewsService.js";
import AuthService from "../../services/authService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


function checkDevelopmentAccessRights(req, res, next){
    // check group permissions
    AuthService.auth(req.user, AuthService.operations.system.DEVELOPMENT)
        .then(function(result) {
            console.log("authorization successful!");
            next();
        })
        .catch(err => {
            next(err);
        })
}

//hooked at /api/v1/dev

router.post("/database/updateEvents", checkDevelopmentAccessRights, updateEventDatabase);
router.post("/database/updateNews", checkDevelopmentAccessRights, updateNewsDatabase);

function updateEventDatabase(req, res, next) {
    eventService.devUpdateDocuments()
        .then(documents => res.json(documents))
        .catch(err => next(err));
}

function updateNewsDatabase(req, res, next) {
    newsService.devUpdateDocuments()
        .then(documents => res.json(documents))
        .catch(err => next(err));
}


export default router;