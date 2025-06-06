import express from 'express';
var router = express.Router();
import passport from 'passport';
import bodyParser from "body-parser";
import eventService from "../../services/eventService.js";
import AuthService from "../../services/authService.js";

import imageThumbnail from 'image-thumbnail';
import got from 'got';
import path from 'path';
import fs from 'fs-extra';

import upload from "../../config/multer.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.raw());


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
// hooked at api/v1/eventmod

// //check url access by user group
// router.use('/:id', checkUrlAccess);


/**
 * eventmod routes
 */

//creation. need creation rights
router.post('/create', allowCreateEvent, create);

//participant modification. this requires write access, unless the user modifies itself.
router.post('/addParticipant', checkParticipantAccess, addParticipant);
router.post('/removeParticipant', checkParticipantAccess, removeParticipant);
router.post('/assignPost', checkParticipantAccess, assignPost);
router.post('/unassignPost', checkParticipantAccess, unassignPost);
router.post('/checkUserForAssignment', checkParticipantAccess, checkUserForAssignment);

// changing role requires editing rights
router.post('/changeParticipant', checkEventEditRights, changeParticipant);
//adding posts requiores editing rights
router.put('/addPost', checkEventEditRights, addPost);
router.post('/updatePost', checkEventEditRights, updatePost);
router.delete('/removePost', checkParticipantAccess, removePost);


//modification. need general or individual editing rights
router.put('/:id', checkEventEditRights, update);
router.put('/updateKey/:id', checkEventEditRights, updateKey);
router.put('/updateTitle/:id', checkEventEditRights, updateTitle);
router.put('/updateDescription/:id', checkEventEditRights, updateDescription);
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




//viewing. needs general url access
router.get("/*", checkEventReadRights);
router.get('/', getAll);
router.post('/', filterEventsAdvanced);
router.get('/:id/populateParticipants', populateParticipants);
router.get('/:id/files/:filename', eventFileDownloader);
router.post('/filter', matchAny);
router.get('/userEvents', currentUserEvents);
router.get('/userEvents/:id', userEvents);
router.post('/userEvents', userEventsAdvanced);
router.get('/userPostings', currentUserPostings);
router.get('/userPostings/:id', userPostings);
router.post('/upcoming', getUpcoming);
router.post('/past', getPast);
router.get('/:id', getById);



export default router;

function create(req, res, next) {

    /**
     * @typedef {Object} create_body
     * @property title {Object}
     * @property type {String}
     * @property startDate {Int} timestamp
     * @property endDate {Int} timestamp
     * @property description {Object}
     * @property description.longDescription {String}
     * @property description.shortDescription {String}
     * @property location {String}
     */

    /**
     * @type create_body
     */
    const body = req.body;
    eventService.create(req, {
        title: body.title,
        type: body.type,
        description: {
            shortDescription: body.description.shortDescription,
            longDescription: body.description.longDescription
        },
        location: body.location,
        startDate: body.startDate,
        endDate: body.endDate
    })
        .then(event => {
            res.json(event)
        })
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


function currentUserEvents(req, res, next) {
    let userFilter = {
        filter: "participants.user",
        value: req.user._id,
    }
    let args = {
        filter: userFilter,
    }
    eventService.getAllFiltered(args)
        .then(event => {
            event ? res.json(event) : res.sendStatus(404)
        })
        .catch(err => {
            next(err)
        });
}



function currentUserPostings(req, res, next) {
    let args = {
        dateFilter: {
            selector: "all",
        }
    }
    eventService.getUserPostings(req.user._id, args)
        .then(postings => {
            postings ? res.json(postings) : res.sendStatus(404)
        })
        .catch(err => {
            next(err)
        });
}

function userPostings(req, res, next) {
    let args = {
        dateFilter: {
            selector: "all",
        }
    }
    eventService.getUserPostings(req.params.id, args)
        .then(postings => {
            postings ? res.json(postings) : res.sendStatus(404)
        })
        .catch(err => {
            next(err)
        });
}

function userEvents(req, res, next) {
    let userFilter = {
        filter: "participants.user",
        value: req.params.userid,
    }
    eventService.getAllFiltered(userFilter)
        .then(event => event ? res.json(event) : res.sendStatus(404))
        .catch(err => next(err));
}

function userEventsAdvanced(req, res, next) {
    const userId = req.body.userid;
    if(userId === undefined) {
        next(new ApiValidationError("Invalid arguments received for parameter: userid"))
    }
    filterEventsAdvanced(req, res, next);
}

function filterEventsAdvanced(req, res, next) {
    const userId = req.body.userid;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const matchString = req.body.matchString ? req.body.matchString : "";
    const sort = req.body.sort;
    const amount = req.body.amount ? req.body.amount : undefined;

    if (req.body.args === undefined) req.body.args = {};

    let userFilter = {
        filter: "participants.user",
        value: userId,
    }

    let dateFilter = {
        selector: "gte",
        date: Date.now(),
    };

    if(startDate !== undefined) {
        dateFilter.date = startDate
    }
    if(endDate !== undefined) {
        dateFilter.selector = "lte"
        dateFilter.date = endDate
    }
    if(startDate !== undefined && endDate !== undefined) {
        dateFilter.selector = "range";
        dateFilter.minDate = startDate;
        dateFilter.maxDate = endDate;
    }

    let filterArray = [];

    if(userId) {
        filterArray.push(userFilter);
    }

    let args = {
        filter: filterArray,
        sort: sort,
        dateFilter: dateFilter,
    }
    eventService.matchAny(matchString, args)
        .then(event => {
            if(event) {
                let response;
                if (amount !== undefined) {
                    response = event.splice(0,amount)
                }
                else response = event;
                res.json(response)
            }
            else {
                res.sendStatus(404)
            }
        })
        .catch(err => next(err));
}

function update(req, res, next) {
    eventService.update(req, req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => {
            next(err)
        });
}

function updateKey(req, res, next) {
    eventService.updateKey(req, req.params.id, req.body.key, req.body.value, {})
        .then(result => {
            res.json(result)
        })
        .catch(err => next(err));
}

function updateTitle(req, res, next) {
    eventService.updateTitle(req, req.params.id, req.body)
        .then(result => {
            res.json(result)
        })
        .catch(err => next(err));
}

function updateDescription(req, res, next) {
    eventService.updateDescription(req, req.params.id, req.body)
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
        .catch(err => {
            next(err)
        });
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

function addPost(req, res, next){
    let args = {
        overwrite: false
    };

    let posting = req.body.posting;
    let id = req.body.id;
    eventService.addPosting(req, id, posting, args)
        .then(event => res.json({}))
        .catch(err => {
            next(err);
        })
}


function updatePost(req, res, next){
    let args = {
        overwrite: false
    };
    let posting = req.body.posting;
    let eventId = req.body.id;
    eventService.updatePosting(req, eventId, posting, args)
        .then(event => res.json({}))
        .catch(err => {
            next(err);
        })
}

function removePost(req, res, next){
    eventService.removePosting(req, req.body.id, req.body.postingId)
        .then(event => res.json({}))
        .catch(err => {
            next(err);
        })
}

function assignPost(req, res, next) {

    let args = {
        overwrite: false,
        ignoreRequiredQualification: false,
    };
    eventService.assignPost(req, req.body.id, req.body.postingId, req.body.userId, args)
        .then(() => res.json({}))
        .catch(err => {
            next(err);
        })
}

function unassignPost(req, res, next) {

    eventService.unassignPost(req, req.body.id, req.body.userId, req.body.postingId)
        .then(() => res.json({}))
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

function checkUserForAssignment(req, res, next) {
    eventService.checkUserForAssignment(req.body.userId, req.body.eventId, req.body.postingId)
        .then(function(result) {
            res.json(result);
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
