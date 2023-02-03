import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import protocolService from "../../services/apps/protocolService.js";
import authService from "../../services/authService.js";


var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


function checkUrlAccess(req, res, next){
    authService.checkUrlPermission(req.user,req.method,req.originalUrl)
        .then(function(result){
            if(result){
                console.log("authorization successful!");
                next();
            }
            else {
                console.log("authorization failed!");
                next({status:403, message: "forbidden"});
            }
        })
        .catch(err => next(err))
}

// routes

router.get('/', getAll);
router.post('/create', createDocument)
router.get("/", checkUrlAccess);
router.get('/current', getCurrentUserDocuments);
router.get('/:userid/docs/:documentid', getDocument);
router.post('/:userid/docs/:documentid', updateDocument);
router.get('/:userid', getUserDocuments);
router.get('/:userid', getUserDocuments);
router.delete('/:id', deleteDocument);


function getAll(req, res, next) {
    protocolService.getAll()
        .then(result => res.json(result))
        .catch(err=> next(err))
}

function getUserDocuments(req, res, next) {
    protocolService.getUserDocuments(req.params.userid)
        .then(result => res.json(result))
        .catch(err=> next(err))
}

function getCurrentUserDocuments(req, res, next) {
    protocolService.getUserDocuments(req.user._id)
        .then(result => res.json(result))
        .catch(err=> next(err))
}


function getDocument(req, res, next) {
    protocolService.getById(req.params.documentid)
        .then(result => res.json(result))
        .catch(err=> next(err))
}

function createDocument(req, res, next) {
    protocolService.create(req, req.body)
        .then(result => res.json(result))
        .catch(err=>next(err))
}

function updateDocument(req, res, next) {
    protocolService.update(req, req.params.documentid, req.body)
        .then(result => res.json(result))
        .catch(err=> next(err))
}

function deleteDocument(req, res, next) {
    protocolService.delete(req.params.id)
        .then(res.json({}))
        .catch(err=>next(err))
}

export default router;


