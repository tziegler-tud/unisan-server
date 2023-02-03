import express from 'express';
var router = express.Router();
import bodyParser from "body-parser";

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
// router.get('/', getDockerArguments, function(req, res, next) {
//     res.render("unisams/index",
//         {
//             title: "uniSams",
//             user: req.user._doc,
//             docker: req.docker,
//         })
// });
router.get('/', function(req, res, next) {
    res.redirect("/unisams/dashboard");
});



export default router;