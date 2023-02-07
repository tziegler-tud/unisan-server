
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import logger from 'morgan';
import session from "express-session";
import SessionFileStore from "session-file-store";
const FileStore = SessionFileStore(session);
import uuid from 'uuid';

var errorHandler = require("./helpers/error-handler");

import oidcService from "./services/oicd/oicdService.js";


import fs from 'fs';
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
global.appRoot = path.resolve(__dirname);

import multer from 'multer';
import errorHandler from "./helpers/error-handler.js";



// include routes here

import indexRouter from './routes/index/index.js';
import loginRouter from './routes/unisams/login.js';
import mainRouter from './routes/unisams/index.js';
import dashboardRouter from './routes/unisams/dashboard.js';
import userManagementRouter from './routes/unisams/user.js';
import eventManagementRouter from './routes/unisams/events.js';
import systemRouter from './routes/unisams/system.js';
import settingsRouter from './routes/unisams/settings.js';
import protocolRouter from './routes/unisams/protocol.js';

import publicProtocolRouter from './routes/unisams/protocol_public.js';

import authRouter from './routes/api/auth.js';
import userACLRouter from './routes/api/userACL.js';
import accessRightsRouter from './routes/api/accessrights.js';
import userGroupRouter from './routes/api/userGroup.js';
import userApiRouter from './routes/api/usermod.js';
import eventApiRouter from './routes/api/eventmod.js';
import qualificationApiRouter from './routes/api/qualification.js';
import userDatasetApiRouter from './routes/api/userDataset.js';
import logsRouter from './routes/api/logs.js';
import protocolApiRouter from './routes/api/protocol.js';


//initialize server
var server = express();


import passport from './config/passport.js';
import upload from "./config/multer.js";




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


let apiAuth = function(req, res, next){
  if (!req.isAuthenticated()) {
    res.status(401).send();
    // res.redirect('/unisams/login');
  } else {
    next();
  }
};


let webAuth = function(req, res, next){
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

import oicdRouter from "./routes/oicd/index.js"
oidcService.init.then((oicd)=>{
  server.use(oicd.url, oicd.provider.callback());
  server.use("/oicdIt", oicdRouter);
})

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
server.use('/unisams/system', systemRouter);
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

//forwarding
server.use("/", indexRouter);






  // // render the error page
  // res.status(err.status || 500);
  // res.render('error');
// });

// use(errorHandler());


export default server;
