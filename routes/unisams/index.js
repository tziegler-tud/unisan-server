var express = require('express');
var router = express.Router();
var uuid = require('uuid');
const passport = require('passport');
const bodyParser = require("body-parser");
// const AclService = require("../../services/aclService");

var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

function getDockerArguments (req, res, next) {
    // AclService.getCurrentDocker(req.user._id)
    //     .then(docker => {
    //         req.docker = docker;
    //         next()
    //     })
    req.docker = {};
    next();
}


/* GET pages. */
router.get('/', getDockerArguments, function(req, res, next) {
    res.render("unisams/index",
        {
            title: "uniSams",
            user: req.user._doc,
            docker: req.docker,
        })
});



module.exports = router;