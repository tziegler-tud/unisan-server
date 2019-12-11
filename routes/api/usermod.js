const express = require('express');
const router = express.Router();
const userService = require('../../services/userService');
const uploadService = require('../../services/uploadService');

var path = require('path');
var fs = require('fs-extra');

const upload = require(appRoot + "/config/multer");


router.post('/:id/uploadUserImage', upload.single('image'), function(req, res, next){
    userService.getById(req.params.id)
        .then(user => {
            fs.move(appRoot + '/src/data/uploads/tmp/tmp.jpg', appRoot + `/src/data/uploads/${user.id}/${user.id}.jpg`, { overwrite: true }, function (err) {
                if (err) return console.error(err);
                console.log("moved file to user dir: " + user.id);
            });
            res.json({success: true});
        })
        .catch(err => next(err));
});

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.put('/deleteKey/:id', deleteKey);
router.put('/updateKey/:id', updateKey);
router.delete('/:id', _delete);



module.exports = router;

function create(req, res, next) {
  userService.create(req.body)
      .then(() => res.json(req.body))
      .catch(err => {
        next(err);
      })
}

function getAll(req, res, next) {
  userService.getAll()
      .then(users => res.json(users))
      .catch(err => next(err));
}

function getCurrent(req, res, next) {
  userService.getById(req.user.id)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}

function getById(req, res, next) {
  userService.getById(req.params.id)
      .then(user => user ? res.json(user) : res.sendStatus(404))
      .catch(err => next(err));
}

function update(req, res, next) {
  userService.update(req.params.id, req.body)
      .then(() => res.json({}))
      .catch(err => next(err));
}

function updateKey(req, res, next) {
    userService.updateKey(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function deleteKey(req, res, next) {
    if(!req.body.key){
    }
    userService.deleteKey(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
  userService.delete(req.params.id)
      .then(() => res.json({}))
      .catch(err => next(err));
}
