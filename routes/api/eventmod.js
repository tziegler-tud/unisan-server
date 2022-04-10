var express = require('express');
var router = express.Router();
const { v1: uuidv1, v2: uuidv4 } = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const eventService = require('../../services/eventService');
const uploadService = require('../../services/uploadService');
const AuthService = require('../../services/authService');
const imageThumbnail = require('image-thumbnail');

const got = require('got');

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.raw());


var path = require('path');
var fs = require('fs-extra');

const upload = require(appRoot + "/config/multer");

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


function checkParticipantAccess (req, res, next) {
    //check if trying to add self
    if (req.user.id === req.body.userId) {
        //allow operation
        next()
    }
    else {
        //if not modifying self, editing rights are required
        req.params.id = req.body.id;
        checkEventEditRights(req, res, next);
    }
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


// routes

// //check url access by user group
// router.use('/:id', checkUrlAccess);


/**
 * eventmod routes
 */

//creation. need creation rights
router.post('/create', allowCreateEvent, create);

//modification. need general or individual editing rights
router.put('/:id', checkEventEditRights, update);
router.put('/updateKey/:id', checkEventEditRights, updateKey);
router.delete('/:id', checkEventEditRights, _delete);

/**
 * filepond upload endpoint.
 * filepond expects a unique id returned to identify the uploaded file.
 */
router.post('/:id/uploadFile', checkEventEditRights, upload.single("file"), filepondUploader);
router.delete('/:id/uploadFile', checkEventEditRights, filepondDeleter);
router.get('/:id/uploadFile/load/:filename', checkEventEditRights, filepondLoader);
router.get('/:id/uploadFile', checkEventEditRights, filepondFetcher);

router.post('/:id/uploadImage', checkEventEditRights, upload.single('image'), function(req, res, next){
    eventService.getById(req.params.id)
        .then(event => {
            fs.move(appRoot + '/src/data/uploads/tmp/' + req.file.filename, appRoot + `/src/data/uploads/event_images/${event.id}/${event.id}.jpg`, { overwrite: true }, function (err) {
                if (err) return console.error(err);
                console.log("moved file to user dir: " + event.id);
            });
            res.json({success: true});
        })
        .catch(err => next(err));
});

//participant modification. this requires write access, unless the user modifies itself.
router.post('/addParticipant', checkParticipantAccess, addParticipant);
router.post('/removeParticipant', checkParticipantAccess, removeParticipant);
// changing role requires editing rights
router.post('/changeParticipant', checkEventEditRights, changeParticipant);


//viewing. needs general url access
router.get("/*", checkEventReadRights);
router.get('/', getAll);
router.get('/:id/populateParticipants', populateParticipants);
router.get('/:id/files/:filename', eventFileDownloader);
router.post('/filter', matchAny);
router.post('/upcoming', getUpcoming);
router.post('/past', getPast);
router.get('/:id', getById);



module.exports = router;

function create(req, res, next) {
    eventService.create(req, req.body)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function getAll(req, res, next) {
    eventService.getAll()
        .then(events => res.json(events))
        .catch(err => next(err));
}


function getById(req, res, next) {
    eventService.getById(req.params.id)
        .then(event => event ? res.json(event) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    eventService.update(req, req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function updateKey(req, res, next) {
    eventService.updateKey(req, req.params.id, req.body.key, req.body.value, {})
        .then(result => {
            res.json(result)
        })
        .catch(err => next(err));
}

function matchAny(req, res, next){
    if (req.body.filter === undefined) req.body.filter = "";
    eventService.matchAny(req.body.filter, req.body.args)
        .then(function(eventlist) {
            res.json(eventlist);
        })
        .catch(err => next(err));
}


function getUpcoming(req, res, next) {
    if (req.body.filter === undefined) req.body.filter = "";
    eventService.matchAny(req.body.filter, req.body.args)
        .then(function(eventlist) {
            res.json(eventlist);
        })
        .catch(err => next(err));
}

function getPast(req, res, next) {
    eventService.matchAny(req.body.filter, req.body.args)
        .then(function(eventlist) {
            res.json(eventlist);
        })
        .catch(err => next(err));
}


function addParticipant(req, res, next) {

    let args = {
        role: req.body.role,
        overwrite: false
    };
    eventService.addParticipant(req, req.body.id, req.body.userId, args)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function changeParticipant(req, res, next) {
    let args = {
        role: req.body.role,
        overwrite: true,
    };
    eventService.addParticipant(req, req.body.id, req.body.userId, args)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function removeParticipant(req, res, next) {
    let args = {

    };
    eventService.removeParticipant(req, req.body.id, req.body.userId, args)
        .then(() => res.json(req.body))
        .catch(err => {
            next(err);
        })
}

function populateParticipants(req, res, next) {
    eventService.populateParticipants(req.params.id)
        .then(function(event) {
            res.json(event);
        })
        .catch(err => {
            next(err);
        })
}

function _delete(req, res, next) {
    eventService.delete(req, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function filepondUploader(req, res, next){
    eventService.getById(req.params.id)
        .then(event => {
            //generate unique id
            let uniqueId = req.file.originalname;
            let size = req.file.size;
            //create event dir if not exist
            fs.mkdir(appRoot + '/src/data/uploads/event_files/' + event.id, { recursive: true, overwrite: false }, (err) => {
                if (err) {
                    throw err;
                }
            });
            fs.mkdir(appRoot + '/src/data/uploads/event_files/' + event.id + "/thumbnails", { recursive: true, overwrite: false }, (err) => {
                if (err) {
                    throw err;
                }
            });
            //if img, create thumnail and move to same directory. filename: THUMB_<filename>
            if(checkIfImageFile(req.file.mimetype)){
                //generate thumbnail
                let options = { width: 200 }
                imageThumbnail(appRoot + '/src/data/uploads/tmp/' + req.file.filename, options)
                    .then(thumbnail => {
                        fs.writeFile(appRoot + `/src/data/uploads/event_files/${event.id}/thumbnails/${uniqueId}`, thumbnail);
                        moveToPermanentDir();

                    })
                    .catch(err => {
                        console.error(err);
                        moveToPermanentDir();
                    });
            }
            else {
                moveToPermanentDir()
            }
            function moveToPermanentDir(){
                fs.move(appRoot + '/src/data/uploads/tmp/' + req.file.filename , appRoot + `/src/data/uploads/event_files/${event.id}/${uniqueId}`, { overwrite: true }, function (err) {
                    if (err) return console.error(err);
                    console.log("moved file to dir: event_files/" + event.id);
                });
            }

            //store reference to event doc
            let filename = uniqueId;
            let filetype = req.file.mimetype;
            eventService.addFileReference(req, event, filename, filetype, size, {})
                .then(function(){
                    res.send(uniqueId);
                })
                .catch(function(error){
                    console.log(error);
                    res.status(500);
                })
        })
        .catch(err => next(err));
}

function filepondDeleter(req, res, next){
    eventService.getById(req.params.id)
        .then(event => {
            //req.body contains uniqueId
            let uniqueId = req.body
            let path = appRoot + `/src/data/uploads/event_files/${event.id}/${uniqueId}`;
            try {
                fs.unlinkSync(path)
                //file removed
            } catch(err) {
                console.error(err);
                res.status(400);
            }
            //if thumbnail was created, remove it as well
            let thumbnailPath = appRoot + `/src/data/uploads/event_files/${event.id}/thumbnails/${uniqueId}`
            let thumbnailExists = checkFileExists(thumbnailPath)
                .then(function(exists){
                    if (exists) {
                        // console.log("Removing thumbnail...");
                        fs.unlinkSync(thumbnailPath);
                    }
                })
                .catch(err => next(err))
            eventService.removeFileReference(req, event, uniqueId, {})
                .then(function(){
                    res.status(200);
                    res.send(200);
                })
                .catch(err => next(err))
        })
        .catch(err => next(err));
}

function filepondFetcher(req, res, next){
    eventService.getById(req.params.id)
        .then(event => {
            //req.body contains uniqueId
            let fetchUrl = req.query.fetch;

            got(fetchUrl, {method: "GET", responseType: "buffer", encoding: null}).then(response => {
                //try saving to see response on server
                // fs.writeFile(appRoot + "/src/data/uploads/tmp/test2.jpg", response.body);
                res.set('Content-Type', response.headers["content-type"]);
                // res.set(response.headers);
                res.send(response.body);
            }).catch(error => {
                console.log(error.response.body);
            });

        })
        .catch(err => next(err));
}

function filepondLoader(req, res, next){
    eventService.getById(req.params.id)
        .then(event => {
            //req.body contains uniqueId
            let filename = req.params.filename;
            let path = appRoot + "/src/data/uploads/event_files/" + event.id + "/"
            let filepath = path + filename;
            //check if file exists
            try {
                if (fs.existsSync(filepath)) {
                    res.set('Content-Disposition', 'inline; filename="' + filename + '"');
                    res.sendFile(filepath);
                }
            } catch(err) {
                res.status(404);
            }



        })
        .catch(err => next(err));
}


function eventFileDownloader(req, res, next){
    eventService.getById(req.params.id)
        .then(event => {
            //req.body contains uniqueId
            let filename = req.params.filename;
            let path = appRoot + "/src/data/uploads/event_files/" + event.id + "/"
            let filepath = path + filename;
            //check if file exists
            try {
                if (fs.existsSync(filepath)) {
                    res.set('Content-Disposition', 'attachment; filename="' + filename + '"');
                    res.sendFile(filepath);
                }
            } catch(err) {
                res.status(404);
            }



        })
        .catch(err => next(err));
}

function checkIfImageFile(mimeType) {
    //split mime-type into type and subtype
    let [type, subtype] = mimeType.split("/");
    return type==="image";
}

/**
 * savely checks if a file exists
 * returns a promise that resolves to true if the file exists, or false if it does not exist
 * @returns Promise<Boolean>
 */

function checkFileExists(path) {
    return new Promise(function(resolve, reject){
        fs.access(path, fs.constants.F_OK, error => {
            resolve(!error);
        })
    })
}
