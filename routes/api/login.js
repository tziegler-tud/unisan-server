var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/unisams')
  } else {
    res.render('unisams/login', { title: 'uniSams login' });
  }
});

module.exports = router;