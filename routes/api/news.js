import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import NewsService from "../../services/NewsService.js";
import authService from "../../services/authService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//hooked at /api/v1/news

// routes
router.get('/get', getAll);
router.post("/add", create);
router.put("/update/:id", update);
router.get('/author/:id', getByAuthor);
router.post('/tags', getByTags);
router.post('/filter', getFiltered);
router.get('/get/:id', getById);
router.delete("/all", _deleteAll);
router.delete("/:id", _delete);

function getAll(req, res, next){
    NewsService.getAll()
        .then(function(result){
            res.json(result)
        })
        .catch(err => next(err));
}

function getById(req, res, next){
    NewsService.getById(req.params.id)
        .then(result => res.json(result))
        .catch(err => next(err));
}

function getByTags(req, res, next){
    const tagArray = req.body.tags;
    const combiner = req.body.combiner;
    NewsService.getAllByTags(tagArray, combiner)
        .then(function(result){
            res.json(result);
        })
        .catch(function(err){
            next(err);
        })
}


function getByAuthor(req, res, next){
    const userId = req.params.id;
    NewsService.getAllByAuthor(userId)
        .then(function(result){
            res.json(result);
        })
        .catch(function(err){
            next(err);
        })
}

function getFiltered(req, res, next){
    if (req.body.filter === undefined) req.body.filter = [];
    NewsService.getAllFiltered(req.body.filter, req.body.args)
        .then(function(resultlist) {
            res.json(resultlist);
        })
        .catch(err => next(err));
}

function create(req, res, next){
    NewsService.create(req, req.body)
        .then(function(result){
            res.json(result)
        })
        .catch(err => next(err));
}

function update(req, res, next){
    NewsService.update(req, req.params.id, req.body)
        .then(function(result){
            res.json(result)
        })
        .catch(err => next(err));
}

function _delete(req, res, next) {
    NewsService.delete(req, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _deleteAll(req, res, next) {
    NewsService.deleteAll()
        .then(() => res.json({}))
        .catch(err => next(err));
}

export default router;
