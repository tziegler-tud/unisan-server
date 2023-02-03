import express from 'express';
var router = express.Router();
import userDatasetService from "../../services/userDatasetService.js";

// routes
router.post('/create', create);
router.post('/insertNode', insertNode);
router.get('/', getAll);
router.get('/getRootNode', getRootNode);
router.get('/getCategories', getCategories);
router.get('/getChildren/:id', getChildren);
router.get('/getByTitle/:title', getByTitle);
router.get('/:id', getById);
router.put('/:id', updateNode);
router.delete('/:id', _deleteNode);



export default router;

function create(req, res, next) {
    userDatasetService.insertNode(req.body)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function insertNode(req, res, next) {
    userDatasetService.insertNode(req.body.dataset, req.body.parentId)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}


function getAll(req, res, next) {
    userDatasetService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userDatasetService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getByTitle(req, res, next) {
    userDatasetService.getByTitle(req.params.title)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function updateNode(req, res, next) {
    userDatasetService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _deleteNode(req, res, next) {
    userDatasetService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}


function getRootNode(req, res, next){
    userDatasetService.getRoot()
        .then((root) => res.json(root))
        .catch(err => next(err));
}

function getChildren(req, res, next){
    userDatasetService.getById(req.params.id)
        .then(function(node) {
            userDatasetService.getChildren(node)
                //.then(childs => res.json(childs))
                .then(function (childs){
                    res.json(childs)
                })
                .catch(err => console.error(err))
        })
        .catch(err => next(err));
}

function getCategories(req, res, next){
    userDatasetService.getRoot()
        .then(function(root) {
            userDatasetService.getChildren(root)
                //.then(childs => res.json(childs))
                .then(function (childs){
                    var data = {
                      categories: childs
                    };
                    res.json(data)
                })
                .catch(err => console.error(err))
        })
        .catch(err => next(err));
}

