import db from '../schemes/mongo.js';
const Settings = db.SystemSettings;
import dotenv from 'dotenv'

import {refJSON} from "../helpers/helpers.js"
import path from "path";

import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @class
 * @constructor
 * Singleton
 */
class SystemService {
    constructor() {
        let self = this;
        this.initStarted = false;
        this.status = this.statusEnum.NOTSTARTED;


        dotenv.config({path: path.join(__dirname, "../", "default.env"),override: false})
        dotenv.config({path: path.join(__dirname, "../", ".env"), override: true})

        this.init = new Promise(function (resolve, reject) {
            self.resolveInit = resolve;
            self.rejectInit = reject;
        })

        this.debugLabel = "SettingsService: ";
        this.settings = undefined;
        this.settingsObject = {};
        this.defaultSettings = {
            debugLevel: 0
        }

        this.hostname = "localhost";
        this.port = "3000";

        this.version = "";
        this.build = "";
        this.started = undefined;

        return this;
    }

    start({config={}}){
        let self = this;
        this.initStarted = true;
        this.initFunc({config})
            .then(result => {
                self.status = self.statusEnum.RUNNING;
                self.resolveInit();
            })
            .catch(err => {
                self.status = self.statusEnum.FAILED;
                self.rejectInit();
            });
        return this.init;
    }

    initFunc({config}) {
        let self = this;
        return new Promise(function (resolve, reject) {
            console.log("Loading settings...");
            let errMsg = "Failed to initialize SettingsService:";

            self.started = Date.now();

            self.loadConfig(config);

            //try to load from db
            self.load()
                .then(result=> {
                    self.settings = result;
                    self.save();
                    resolve(result)
                })
                .catch(err=> {
                    //failed to load settings from db. Create a fresh one and save it
                    self.create()
                        .then( result=> {
                            resolve(result);
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
        })
    }

    loadConfig(configJSON){
        this.config = configJSON;
        this.hostname = configJSON.hostname ?? this.hostname;
        this.port = configJSON.port ?? this.port;

        this.version = process.env.VERSION ?? this.version;
        this.build = process.env.BUILD ?? this.build;
    }

    create(params) {
        let defaults = this.defaultSettings;
        params = Object.assign(defaults, params);
        params.identifier = params.identifier ? params.identifier : "UnisanServer-default-" + Date.now();
        let settings = new Settings(params)
        this.settings = settings;
        this.settingsObject = settings.toJSON();
        return settings.save()
    }

    save(){
        return this.settings.save();
    }

    load(){
        let self = this;
        return new Promise(function (resolve, reject) {
            //check known servers in db
            Settings.findOne()
                .then(function(settings) {
                    if(!settings){
                        //no file found
                        reject("No settings document found in database");
                    }
                    self.settings = settings;
                    self.settingsObject = settings.toJSON();
                    resolve(settings);
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    getSettings() {
        if(!this.status === this.statusEnum.RUNNING){
            throw new Error("Failed to get Settings: SystemService not available.");
        }
        else {
            return this.settingsObject;
        }
    }

    getSystemInformation(){
        if(!this.status === this.statusEnum.RUNNING){
            throw new Error("Failed to get SystemInformation: SystemService not available.");
        }
        else {
            return {
                version: this.version,
                build: this.build,
                port: this.port,
                hostname: this.hostname,
                started: this.started,
            }
        }
    }

    async set({key, value}={}){
        if(!key) return false;
        let entry = refJSON(this.settings, key);
        Object.assign(entry, value);
        await this.save();
        this.settingsObject = this.settings.toJSON();
        return this.settingsObject;
    }

    async setMemberIdSettings({mode, offset}){
        const allowedValues = ["auto", "auto-free", "free", "off"];
        if(!allowedValues.includes(mode)){
            throw new Error("Invalid value for parameter: 'mode' received.");
        }

        if(offset === undefined) offset = 0;
        else {
            offset = parseInt(offset)
        }
        if(typeof offset !== "number" || offset < 0){
            throw new Error("Invalid value for parameter: 'offset' received.");
        }
        this.settings.members.memberId = {
            mode: mode,
            offset: offset,
        }
        await this.save();
        this.settingsObject = this.settings.toJSON();
        return this.settingsObject;
    }

    statusEnum = {
        NOTSTARTED: 0,
        RUNNING: 1,
        STOPPED: 2,
        FAILED: 3,
    }
}

export default new SystemService();