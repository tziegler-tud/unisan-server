import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import userService from "../../services/userService.js";
import logService from "../../services/logService.js";
import authService from "../../services/authService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//hooked at /api/v1/logs

// routes
router.get('/get', getAll);
router.post('/get/target', getTargetLogs);
router.post('/get/filter', getFilteredLogs);
router.get('/get/:id', getById);
router.delete("/all", _deleteAll);
router.delete("/:id", _delete);

function getAll(req, res, next){
    logService.getAll()
        .then(function(result){
            res.json(result)
        })
        .catch(err => next(err));
}

function getById(req, res, next){
    logService.getById(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function getTargetLogs(req, res, next){
    logService.getTargetLogsById(req.body.targetId, req.body.logType)
        // .then(result => res.json(result))
        // .catch(err => next(err));
        .then(function(result){
            res.json(result);
        })
        .catch(function(err){
            next(err);
        })
}

function getFilteredLogs(req, res, next){
    if (req.body.filter === undefined) req.body.filter = "";
    logService.getAllFiltered(req.body.filter, req.body.args)
        .then(function(resultlist) {
            res.json(resultlist);
        })
        .catch(err => next(err));
}

function _delete(req, res, next) {
    logService.delete(req, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _deleteAll(req, res, next) {
    logService.deleteAll()
        .then(() => res.json({}))
        .catch(err => next(err));
}

export default router;
