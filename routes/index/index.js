var express = require('express');
var router = express.Router();
const bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/**
 * hooked at /
 * forward request to /unisams
 */
router.all('/', function(req, res, next) {
  res.redirect('/unisams')
});

module.exports = router;