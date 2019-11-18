var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('public/index', { title: 'Studentischer Sanitätsdienst TU Dresden', greetings: res.__("teaser_join_head")});
});

module.exports = router;