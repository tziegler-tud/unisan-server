import express from 'express';
var router = express.Router();
import bodyParser from "body-parser";
import AuthService from "../../services/authService.js";
import EventFactoryService from "../../services/eventFactoryService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.raw());

//hooked at /api/v1/eventfactory

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
        .catch(err => next(err))
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

router.get('/', checkEventReadRights, getAll);
router.get('/:id', checkEventReadRights, getById)
router.get('/:id/populate', checkEventReadRights, getPopulated)
router.post('/filter', checkEventReadRights, filter)
router.post('/createBlueprint', allowCreateEvent, createBlueprint);
router.delete('/:id', checkEventEditRights, _delete);
router.put('/:id/updateLocation', checkEventEditRights, updateLocation)
router.put('/:id/updateTitle', checkEventEditRights, updateTitle)
router.put('/:id/updateDescription', checkEventEditRights, updateDescription)
router.put('/:id/updateTime', checkEventEditRights, updateTime)
router.put('/:id/addPost', checkEventEditRights, addPost)
router.post('/:id/updatePost', checkEventEditRights, updatePost)
router.post('/:id/removePost', checkEventEditRights, removePost)


export default router;

function getAll(req, res, next) {
    EventFactoryService.getAll()
        .then(events => res.json(events))
        .catch(err => next(err));
}

function getById(req, res, next) {
    EventFactoryService.getById(req.params.id)
        .then(event => event ? res.json(event) : res.sendStatus(404))
}

function getPopulated(req, res, next) {
    EventFactoryService.getById(req.params.id, true)
        .then(event => event ? res.json(event) : res.sendStatus(404))
}

function createBlueprint(req, res, next) {

    /**
     * @typedef {Object} create_body
     * @property {Object} title
     * @property {string} title.value
     * @property {Object} title.delta
     * @property {string} type
     * @property {number} startDate timestamp
     * @property {number} endDate timestamp
     * @property {Object} description
     * @property {Object} description.longDescription
     * @property {string} description.longDescription.value
     * @property {Object} description.longDescription.delta
     * @property {Object} description.shortDescription
     * @property {string} description.shortDescription.value
     * @property {Object} description.shortDescription.delta
     * @property {string} location
     */

    /**
     * @type {create_body}
     */
    const body = req.body;
    EventFactoryService.create(req, {
        title: body.title,
        type: body.type,
        description: {
            shortDescription: body.description.shortDescription,
            longDescription: body.description.longDescription
        },
        location: body.location,
        date: {
            startDate: body.startDate,
            endDate: body.endDate
        }
    })
        .then(event => {
            res.json(event)
        })
        .catch(err => {
            next(err);
        })
}

function filter(req, res, next) {
    const matchString = req.body.filter
    EventFactoryService.getAllFiltered(matchString)
        .then(events => res.json(events))
        .catch(err => next(err));
}
function _delete(req, res, next) {
    EventFactoryService.delete(req, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function updateTitle(req, res, next) {
    const id = req.params.id;
    const delta = req.body.delta;
    const value = req.body.value;

    EventFactoryService.updateTitle(req, id, {value: value, delta: delta} )
        .then(event => res.json(event))
        .catch(err => next(err));
}

function updateDescription(req, res, next) {
    const id = req.params.id;
    const longDesc = req.body.longDesc;
    const shortDesc = req.body.shortDesc;

    EventFactoryService.updateDescription(req, id, {longDesc: longDesc, shortDesc: shortDesc})
        .then(event => res.json(event))
        .catch(err => next(err));
}

function updateLocation(req, res, next) {
    const id = req.params.id;
    const location = req.body.value;
    EventFactoryService.updateLocation(req, id, location)
        .then(event => res.json(event))
        .catch(err => next(err));
}
function updateTime(req, res, next) {
    const id = req.params.id;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;

    EventFactoryService.updateTime(req, id, startTime, endTime)
        .then(event => res.json(event))
        .catch(err => next(err));
}

function addPost(req, res, next) {
    const id = req.params.id;
    const posting = req.body.posting;
    let args = {
        overwrite: false
    };
    EventFactoryService.addPosting(req, id, posting, args)
        .then(event => res.json(event))
        .catch(err => next(err));
}

function updatePost(req, res, next) {
    let args = {
        overwrite: false
    };
    const id = req.params.id;
    const posting = req.body.posting;
    EventFactoryService.updatePosting(req, id, posting, args)
        .then(event => res.json(event))
        .catch(err => next(err));
}

function removePost(req, res, next) {
    const id = req.params.id;
    const postingId = req.body.postingId;
    EventFactoryService.removePosting(req, id, postingId)
        .then(event => res.json(event))
        .catch(err => next(err));
}