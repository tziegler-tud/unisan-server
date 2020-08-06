const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const lessMiddleware = require('less-middleware');
const logger = require('morgan');
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const uuid = require('uuid');
const multer = require('multer');


var errorHandler = require("./helpers/error-handler");


global.appRoot = path.resolve(__dirname);

var indexRouter = require('./routes/public/index');
var teamRouter = require('./routes/public/team');
var sanRouter = require('./routes/public/san');
var courseRouter = require('./routes/public/courses');
var contactRouter = require('./routes/public/contact');
var impressumRouter = require('./routes/public/impressum');
var datenschutzRouter = require('./routes/public/datenschutz');

const loginRouter = require('./routes/unisams/login');
const mainRouter = require('./routes/unisams/index');
var userManagementRouter = require('./routes/unisams/user');
var eventManagementRouter = require('./routes/unisams/events');
var settingsRouter = require('./routes/unisams/settings');


var authRouter = require('./routes/api/auth');
var accessRightsRouter = require('./routes/api/accessrights');
var userGroupRouter = require('./routes/api/userGroup');
var userApiRouter = require('./routes/api/usermod');
var eventApiRouter = require('./routes/api/eventmod');
var qualificationApiRouter = require('./routes/api/qualification');
var userDatasetApiRouter = require('./routes/api/userDataset');

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

server.use(logger('dev'));
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(cookieParser());
server.use(lessMiddleware(path.join(__dirname, 'src')));
server.use(express.static(path.join(__dirname, 'src')));

server.use(session({
  genid: (req) => {
    console.log('Inside the session middleware');
    console.log(req.sessionID);
    return uuid() // use UUIDs for session IDs
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
    req.session.redirectTo = req.originalUrl;
    res.status(401).redirect('/unisams/login');
  } else {
    next();
  }
};

server.use('/', indexRouter);
server.use('/team', teamRouter);
server.use('/san', sanRouter);
server.use('/kurse', courseRouter);
server.use('/kontakt', contactRouter);
server.use('/info/impressum', impressumRouter);
server.use('/info/datenschutz', datenschutzRouter);


//html calls
server.use('/unisams', loginRouter);
server.use('/unisams', userGroupRouter);
server.use("/unisams*", webAuth);
server.use('/unisams', mainRouter);
server.use('/unisams/user', userManagementRouter);
server.use('/unisams/events', eventManagementRouter);
server.use('/unisams/settings', settingsRouter);
// catch 404 and forward to error handler
server.use("/unisams/*", function(req, res, next) {
  next(createError(404));
});

// webpage error handler
server.use("/unisams", errorHandler.webErrorHandler);


//API calls TODO: change url to /api/v1/...
server.use('/api/v1', authRouter);
server.use('/api/v1/*', apiAuth);
server.use('/api/v1/access', accessRightsRouter);
server.use('/api/v1/usermod', userApiRouter);
server.use('/api/v1/eventmod', eventApiRouter);
server.use('/api/v1/qualification', qualificationApiRouter);
server.use('/api/v1/dataset/user', userDatasetApiRouter);
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
