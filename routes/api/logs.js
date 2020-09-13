var express = require('express');
var uuid = require('uuid');
const passport = require('passport');
var router = express.Router();
const bodyParser = require("body-parser");
const logService = require("../../services/logService");

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// routes
router.get('/get', getAll);
router.post('/get/target', getTargetLogs);
router.get('/get/:id', getById);
router.delete("/:id", _delete);

router.get("/addModelUser", addModelUser);

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

function _delete(req, res, next) {
    logService.delete(req, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}




function addModelUser(req, res, next){
    logService.addModelUser()
        .then(result => res.json(result))
        .catch(err => next(err));
}


module.exports = router;
