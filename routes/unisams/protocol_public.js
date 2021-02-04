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

// routes
router.get("/", editDoc)

router.get("/example", exampleJson);

function editDoc(req, res, next) {
    //get protocol document
    res.render("unisams/apps/protocol/protocol-editor", {
        title: "unisan apps - Dokumentation",
        user: {},
        document: {title: "Neues Protokoll", content: {}},
        version: "public",
    })
}

function exampleJson(req, res, next) {
    res.send({test: "test123"});
}

module.exports = router;


