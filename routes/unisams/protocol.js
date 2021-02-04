var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
const protocolService = require('../../services/apps/protocolService');
const AuthService = require('../../services/authService');


var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


function checkUrlAccess(req, res, next){
    AuthService.checkUrlPermission(req.user,req.method,req.originalUrl)
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

router.get('/', index);
router.get("/protocol-editor", editDoc)
router.get('/:username', checkUrlAccess, userDocuments);

function index(req, res, next) {
    //get user protocol elements
    let documentList = protocolService.getUserDocuments(req.user.username);
    documentList
        .then(function(documentList) {
            res.render("unisams/apps/protocol/index", {
                title: "unisan apps - Dokumentation",
                user: (req.user._doc || {}),
                protocolList: documentList,
            })
        })
        .catch(err=>next(err))

}

function userDocuments(req, res, next) {
    res.render("unisams/apps/protocol/user", {
        title: "unisan apps - Dokumentation",
        user: req.user._doc
    })
}

function editDoc(req, res, next) {
    //get protocol document
    protocolService.getById(req.query.viewkey)
        .then(function(document){
            res.render("unisams/apps/protocol/protocol-editor", {
                title: "unisan apps - Dokumentation",
                user: req.user._doc,
                document: document,
                version: "private",
            })
        })
        .catch(err=>next(err))
}

module.exports = router;


