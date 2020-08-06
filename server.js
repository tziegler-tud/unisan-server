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

auth = function(req, res, next){
  if (!req.isAuthenticated()) {
    req.session.redirectTo = '/unisams';
    res.status(401).send();
    // res.redirect('/unisams/login');
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
server.use('/unisams', mainRouter);
server.use('/unisams', loginRouter);
server.use('/unisams', userGroupRouter);
// server.use("/unisams/*", auth);
server.use('/unisams/user', userManagementRouter);
server.use('/unisams/events', eventManagementRouter);
server.use('/unisams/settings', settingsRouter);


//API calls TODO: change url to /api/v1/...
server.use('/api/v1', authRouter);
server.use('/api/v1/usermod', auth, userApiRouter);
server.use('/api/v1/eventmod', auth, eventApiRouter);
server.use('/api/v1/qualification', auth, qualificationApiRouter);
server.use('/api/v1/dataset/user', auth, userDatasetApiRouter);


// catch 404 and forward to error handler
server.use(function(req, res, next) {
  next(createError(404));
});

// error handler
server.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.locals.__ = res.__ = function() {
    return i18n.__.apply(req, arguments);
  };


  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// use(errorHandler());


module.exports = server;
