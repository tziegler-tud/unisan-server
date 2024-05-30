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
import 'dotenv/config'
import favicon from "serve-favicon";

import config from "./config/config.json" assert {type: "json"};

import oidcService from "./services/oidc/oidcService.js";
import SystemService from "./services/SystemService.js";

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
import systemApiRouter from './routes/api/system.js';
import newsApiRouter from './routes/api/news.js';
import devApiRouter from './routes/api/development.js';

//initialize server
var server = express();


import passport from './config/passport.js';
import upload from "./config/multer.js";
import oidcRouter from "./routes/oidc/index.js";
import oidcInteractionsRouter from "./routes/oidc/interactions.js";
import UserService from "./services/userService.js";




// view engine setup
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'pug');

server.use(bodyParser.urlencoded({
  extended: true
}));
server.use(bodyParser.json());
server.use(bodyParser.text());

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
      res.status(401).redirect('/login');
    })
  } else {
    next();
  }
};

// server.use(favicon(path.join(__dirname, 'src', 'static','favicon.ico')))
// data folder requires authentication
server.use('/data/*', apiAuth);
server.use(express.static(path.join(__dirname, 'src')));
server.use(express.static(path.join(__dirname, 'src', 'static/icons/pwa')));

server.use('/bdd-apps/divi', publicProtocolRouter);
//html calls
//no auth required
server.use('/', loginRouter);
server.use('/apps/protocol', protocolRouter);

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
server.use('/api/v1/system', systemApiRouter);
server.use('/api/v1/news', newsApiRouter);
server.use('/api/v1/dev', devApiRouter);
server.use('/api/v1/apps/protocol', protocolApiRouter);
// catch 404 and forward to error handler
server.use("/api", function(req, res, next) {
  next(createError(404));
});
// api error handler
server.use("/api", errorHandler.apiErrorHandler);

SystemService.start({config: config})
    .then(() => {
        //system service loaded succesfully
        const settings = SystemService.getSettings()
        const system = SystemService.getSystemInformation()
        //set app.locals
        server.locals.app = {
            version: system.version,
            build: system.build
        }
        UserService.ensureAdminUser();
        /* load OidcService */
        oidcService.init()
            .then(() => {
                server.use(oidcService.url, oidcRouter);
                server.use(oidcService.interactionsUrl, oidcInteractionsRouter);
                if (settings.auth.openid.enabled) {
                    oidcService.start()
                        .then(res => {

                        })
                        .catch(err => {
                            console.log(err);
                        })
                }
                loadPublicRoutes();
            })
            .catch(err => {
                throw new Error(err)
            })

    })
    .catch(err => {
        console.log("Failed to get SystemSettings. This is a critical error, shutting down...");
        process.exit();
    })

function loadPublicRoutes(){
    //auth required
    server.use("/", webAuth);
    server.use('/', mainRouter);
    server.use('/dashboard', dashboardRouter);
    server.use('/user', userManagementRouter);
    server.use('/events', eventManagementRouter);
    server.use('/system', systemRouter);
    server.use('/settings', settingsRouter);

    //forwarding
    server.use("/", indexRouter);

    // catch 404 and forward to error handler
    server.use("/", function(req, res, next) {
        next(createError(404));
    });
    // webpage error handler
    server.use("/", errorHandler.webErrorHandler);
}



export default server;
