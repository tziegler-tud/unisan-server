import db from '../schemes/mongo.js';
const Settings = db.SystemSettings;
const Secrets = db.Secrets;
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
                    resolve(settings)

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

    getPublicSettings(){
        return {

        }
    }

    getMailSettings(){
        if(!this.status === this.statusEnum.RUNNING){
            throw new Error("Failed to get Settings: SystemService not available.");
        }
        else {
            return this.settingsObject.mail;
        }
    }

    getAuthSettings(){
        if(!this.status === this.statusEnum.RUNNING){
            throw new Error("Failed to get Settings: SystemService not available.");
        }
        else {
            return this.settingsObject.auth;
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

    /**
     * WARNING: Supports only direct properties! Cannot be used for nested keys!
     * @param key {string}
     * @param value {Object}
     * @returns {Promise<*|{}|boolean>}
     */
    async set({key, value}={}){
        if(!key) return false;
        let entry = this.settings[key];
        Object.assign(entry, value);
        await this.save();
        this.settingsObject = this.settings.toJSON();
        return this.settingsObject;
    }

    async setMailSettings(data={}){
        const settings = {
            enabled: data.enabled,
            createAccountOnUserCreation: data.createAccountOnUserCreation,
            deleteAccountOnUserDeletion: data.deleteAccountOnUserDeletion,
            systemMailAccount: data.systemMailAccount,
            systemMailAccountToken: data.systemMailAccountToken,
            url: data.url,
            port: data.port,
            baseUrl: data.baseUrl,
            imap_url: data.imap_url,
            smtp_url: data.smtp_url,
            domain: data.domain,
        }

        const updatedSettings = this.applyKeysIfPresent(this.settings.mail, settings)
        this.settings.mail = updatedSettings;
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


    async setSecret(key, value){
        /**
         * @type Secrets
         */
        const found = await Secrets.findOne({key: key});
        if(found){
            found.value = value;
            return found.save();
        }
        else {
            const sec = new Secrets({key, value});
            return await sec.save();
        }
    }

    async getSecret(key){
        const sec = Secrets.findOne({key: key});
        if (!sec) return undefined;
        else return sec;
    }

    applyKeysIfPresent(sourceObject, updateObject){
        Object.keys(updateObject).forEach((key) => {
            if (updateObject[key] !== undefined){
                sourceObject[key] = updateObject[key];
            }
        })
        return sourceObject;
    }

    statusEnum = {
        NOTSTARTED: 0,
        RUNNING: 1,
        STOPPED: 2,
        FAILED: 3,
    }
}

export default new SystemService();