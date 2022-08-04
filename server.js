const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const uuid = require('uuid');
const multer = require('multer');
const fs = require('fs');


var errorHandler = require("./helpers/error-handler");


global.appRoot = path.resolve(__dirname);

// include routes here

const loginRouter = require('./routes/unisams/login');
const mainRouter = require('./routes/unisams/index');
const dashboardRouter = require('./routes/unisams/dashboard');
var userManagementRouter = require('./routes/unisams/user');
var eventManagementRouter = require('./routes/unisams/events');
var settingsRouter = require('./routes/unisams/settings');
var protocolRouter = require('./routes/unisams/protocol');

var publicProtocolRouter = require('./routes/unisams/protocol_public');


var authRouter = require('./routes/api/auth');
var userACLRouter = require('./routes/api/userACL');
var accessRightsRouter = require('./routes/api/accessrights');
var userGroupRouter = require('./routes/api/userGroup');
var userApiRouter = require('./routes/api/usermod');
var eventApiRouter = require('./routes/api/eventmod');
var qualificationApiRouter = require('./routes/api/qualification');
var userDatasetApiRouter = require('./routes/api/userDataset');
var logsRouter = require('./routes/api/logs');
var protocolApiRouter = require('./routes/api/protocol');


//initialize server
var server = express();


const passport = require('./config/passport');
const i18n = require ("./config/i18n");
const upload = require("./config/multer");


server.use(i18n.init);




// view engine setup
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'pug');

server.use(bodyParser.urlencoded({
  extended: true
}));
server.use(bodyParser.json());
server.use(bodyParser.text());

// // create a write stream (in append mode)
// var accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), { flags: 'a' })
//
// // setup the logger
// server.use(logger('combined', { stream: accessLogStream }))

server.use(logger('dev')); //logging to console
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(cookieParser());

server.use(session({
  genid: (req) => {
    console.log('Inside the session middleware');
    console.log(req.sessionID);
    return uuid() // use UUIDs for session IDs
  },
  cookie: {
    secure: false,            //setting this false for http connections
  },
  store: new FileStore(),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

server.use(passport.initialize());
server.use(passport.session());


apiAuth = function(req, res, next){
  if (!req.isAuthenticated()) {
    res.status(401).send();
    // res.redirect('/unisams/login');
  } else {
    next();
  }
};


webAuth = function(req, res, next){
  if (!req.isAuthenticated()) {
    req.session.redirectTo = req.originalUrl; //strange bug setting favicon as url, disable until fixed
    req.session.save(function(){
      res.status(401).redirect('/unisams/login');
    })
  } else {
    next();
  }
};

// data folder requires authentication
server.use('/data/*', apiAuth);
server.use(express.static(path.join(__dirname, 'src')));

server.use('/bdd-apps/divi', publicProtocolRouter);
//html calls
//no auth required
server.use('/unisams', loginRouter);
server.use('/unisams/apps/protocol', protocolRouter);

//auth required
server.use("/unisams", webAuth);
server.use('/unisams', mainRouter);
server.use('/unisams/dashboard', dashboardRouter);
server.use('/unisams/user', userManagementRouter);
server.use('/unisams/events', eventManagementRouter);
server.use('/unisams/settings', settingsRouter);

// catch 404 and forward to error handler
server.use("/unisams/*", function(req, res, next) {
  next(createError(404));
});

// webpage error handler
server.use("/unisams", errorHandler.webErrorHandler);


//API calls
server.use('/api/v1', authRouter);
server.use('/api/v1/*', apiAuth);
server.use('/api/v1/acl', userACLRouter);
server.use('/api/v1/groups', userGroupRouter);
server.use('/api/v1/access', accessRightsRouter);
server.use('/api/v1/usermod', userApiRouter);
server.use('/api/v1/eventmod', eventApiRouter);
server.use('/api/v1/qualification', qualificationApiRouter);
server.use('/api/v1/dataset/user', userDatasetApiRouter);
server.use('/api/v1/logs', logsRouter);
server.use('/api/v1/apps/protocol', protocolApiRouter);
// catch 404 and forward to error handler
server.use("/api", function(req, res, next) {
  next(createError(404));
});
// api error handler
server.use("/api", errorHandler.apiErrorHandler);






  // // render the error page
  // res.status(err.status || 500);
  // res.render('error');
// });

// use(errorHandler());


module.exports = server;
