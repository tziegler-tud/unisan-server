var express = require('express');
var router = express.Router();

/* GET team page. */
router.get('/', function(req, res, next) {
  res.render('public/san', { title: 'Sanitätsdienst - Studentischer Sanitätsdienst TU Dresden' });
});

/* POST team */
router.post('/', function(req, res, next) {
  res.render('public/san', { title: 'Sanitätsdienst - Studentischer Sanitätsdienst TU Dresden' });
});

module.exports = router;
