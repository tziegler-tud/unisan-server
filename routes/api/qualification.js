import express from 'express';
var router = express.Router();
import qualificationService from "../../services/qualificationService.js";

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/getByName/:name', getByName);
router.get('/getByType/:type', getByType);
router.get('/groupByType', groupByType);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);



export default router;

function create(req, res, next) {
  qualificationService.create(req.body)
      .then(() => res.json(req.body))
      .catch(err => {
        next(err);
      })
}

function getAll(req, res, next) {
  qualificationService.getAll()
      .then(users => res.json(users))
      .catch(err => next(err));
}

function getById(req, res, next) {
  qualificationService.getById(req.params.id)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}

function getByType(req, res, next) {
    qualificationService.getByType(req.params.type)
        .then(quals => res.json(quals))
        .catch(err => next(err));
}

function getByName(req, res, next) {
    qualificationService.getByTitle(req.params.name)
        .then(quals => quals)
        .catch(err => next(err));
}

function update(req, res, next) {
  qualificationService.update(req.params.id, req.body)
      .then(() => res.json({}))
      .catch(err => next(err));
}

function _delete(req, res, next) {
  qualificationService.delete(req.params.id)
      .then(() => res.json({}))
      .catch(err => next(err));
}


function groupByType(req, res, next){
    qualificationService.groupByType(req.params.qualType)
        .then((byType) => res.json(byType))
        .catch(err => next(err));
}
