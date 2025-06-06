import config from '../config/db.json' with {type: "json"};
import mongoose from "mongoose";
import autoIncrement from "mongoose-plugin-autoinc-fix";

import UserScheme from "./userScheme.js";
import Qualifications from "./qualificationScheme.js"
import UserDataset from './userDatasetScheme.js';
import Event from './eventScheme.js';
import UserGroup from './userGroupScheme.js';
import UserACL from './userACLScheme.js';
import Log from './logScheme.js';
import Protocol from './protocolScheme.js'
import OidcAccount from './oidcAccountScheme.js'
import OidcClient from './oidcClientScheme.js'
import SystemSettings from './systemSettingsScheme.js'
import News from './newsScheme.js'
import Secrets from './secretsScheme.js'
import EventBlueprint from './eventBlueprintScheme.js'

mongoose.set('debug', false);

var opt = {
    user: config.username,
    pass: config.pwd,
    authSource: config.authSource
};

const optLocalDb = {
    useCreateIndex: true,
    useNewUrlParser: true
};


mongoose.connect(config.connectionString,opt);  // use this for remote database
// const connection = mongoose.connect("mongodb://localhost:27017/unisan-test", optLocalDb);  // use this for locale database
mongoose.Promise = global.Promise;

export default {
    User: UserScheme,
    Qualifications: Qualifications,
    UserDataset: UserDataset,
    Event: Event,
    UserGroup: UserGroup,
    UserACL: UserACL,
    Log: Log,
    Protocol: Protocol,
    OidcAccount: OidcAccount,
    OidcClient: OidcClient,
    SystemSettings: SystemSettings,
    Secrets: Secrets,
    News: News,
    EventBlueprint: EventBlueprint
};