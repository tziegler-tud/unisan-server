import UserService from "../userService.js";
import SystemService from "../SystemService.js";
import 'dotenv/config'
import AbstractService from "../AbstractService.js";
import MailuApiUtility from "./mailuApiUtility.js";
import userService from "../userService.js";

import crypto from "crypto";

/** @import { CreateUserConfig } from './types.js' */
/** @import { UpdateUserConfig } from './types.js' */

class MailService extends AbstractService {
    constructor({}={}){
        super();
        this.serviceName = "Mail Integration Service";
        this.consolePrefix = "MailIntegrationService";
        this.mailDomain;

        /**
         *
         * @type UpdateUserConfig
         */
        this.defaults = {
            quota_bytes: 500000000,
            global_admin: false,
            enabled: true,
            change_pw_next_login: false,
            enable_imap: true,
            enable_pop: true,
            allow_spoofing: false,
            forward_enabled: false,
            forward_destination: [],
            forward_keep: true,
            spam_enabled: true,
            spam_mark_as_read: true,
            spam_threshold: 80
        }
    }

    init(){
        let self = this;
        return new Promise((resolve, reject)=> {
            this.system = SystemService.getSystemInformation();
            this.settings = SystemService.getSettings();
            resolve()
        })
    }

    start(){
        let self = this;
        this.starting = new Promise((resolve, reject) => {
            this.init()
                .then(()=>{
                    if(this.state === self.states.RUNNING) {
                        resolve(this);
                    }
                    else {
                        this.log("Starting " + this.serviceName + "...\n");
                        const mailSettings = this.settings.mail;
                        if(mailSettings === undefined || !mailSettings.url || !mailSettings.domain|| !mailSettings.apiKey){
                            const msg = "Failed to start " + this.serviceName + ": Invalid settings found for 'mail'";
                            this.error(msg);
                            reject(new Error(msg))
                        }
                        this.mailDomain = mailSettings.domain;
                        this.api = new MailuApiUtility({
                            url: mailSettings.url,
                            port: mailSettings.port,
                            apiKey: mailSettings.apiKey,
                            baseUrl: mailSettings.baseUrl,
                            domain: mailSettings.domain,
                        })

                        if(mailSettings.createAccountOnUserCreation){
                            //register userService hooks
                            //create user middleware to set internal email address
                            UserService.addUserCreateMiddlewareAsync(async (args)=> {
                                if(!args.user) return {result: 0, data: {}};
                                //generate email address for firstname.lastname
                                const prefix = args.user.generalData.firstName.value + "." + args.user.generalData.lastName.value;
                                try {
                                    const address = await this.api.generateValidEmailAddress({prefix: prefix})
                                    args.user.internalEmail = address;
                                    return {result: 1, data: args.user};
                                }
                                catch(err) {
                                    return  {result: 0, data: {}};
                                }
                            }, {})

                            UserService.addPostUserCreationHookAsync(async (args)=> {
                                if(!args.user) return {result: 0, data: {}};

                                //create mail account via api
                                let user;
                                try {
                                    const response = await this.api.createUser({
                                        email: args.user.internalEmail,
                                        raw_password: this.generateMailPassword(),
                                        comment: "unisan-server ID: " + args.user._id + ", unisan-server username: " + args.user.username,
                                        displayed_name: args.user.generalData.firstName.value + " " + args.user.generalData.lastName.value,
                                    })
                                    if(response.ok) {
                                        //generate user token
                                        const emailUser = JSON.parse(response.body);
                                    }
                                    else throw new Error("Failed to create user.")
                                }
                                catch(err){
                                    throw new Error("Failed to create user: " + err);
                                }

                                try {
                                    const tokenResponse = await this.api.createUserToken(args.user.internalEmail)
                                    if(tokenResponse.ok){
                                        //try to parse response
                                        const token = JSON.parse(tokenResponse.body).token ?? undefined;
                                        if(token !== undefined) {
                                            await userService.setEmailToken(args.user._id, token)
                                        }
                                        else return {result: 0, data: {}}
                                    }
                                    return {result: 1, data: {}};
                                }
                                catch(err){
                                    return {result: 0, data: {}}
                                }

                            }, {})
                        }
                        this.setStarted();
                        resolve(this)
                    }
                })
                .catch(err=>{
                    reject(err);
                })
        })
        return this.starting;
    }

    /**
     * \= .*\,
     * @param {CreateUserConfig} createUserConfig
     */
    createUser({
                   email,
                   raw_password,
                   comment,
                   quota_bytes= this.defaults.quota_bytes,
                   global_admin= this.defaults.global_admin,
                   enabled= this.defaults.enabled,
                   change_pw_next_login= this.defaults.change_pw_next_login,
                   enable_imap= this.defaults.enable_imap,
                   enable_pop= this.defaults.enable_pop,
                   allow_spoofing= this.defaults.allow_spoofing,
                   forward_enabled= this.defaults.forward_enabled,
                   forward_destination= this.defaults.forward_destination,
                   forward_keep= this.defaults.forward_keep,
                   reply_enabled,
                   reply_subject,
                   reply_body,
                   reply_startdate,
                   reply_enddate,
                   displayed_name,
                   spam_enabled= this.defaults.spam_enabled,
                   spam_mark_as_read= this.defaults.spam_mark_as_read,
                   spam_threshold= this.defaults.spam_threshold,
               }){
        return new Promise((resolve, reject) => {
            // this.api.createUser({
            //     email,
            //     raw_password,
            //     comment,
            //     quota_bytes,
            //     global_admin,
            //     enabled,
            //     change_pw_next_login,
            //     enable_imap,
            //     enable_pop,
            //     allow_spoofing,
            //     forward_enabled,
            //     forward_destination,
            //     forward_keep,
            //     reply_enabled,
            //     reply_subject,
            //     reply_body,
            //     reply_startdate,
            //     reply_enddate,
            //     displayed_name,
            //     spam_enabled,
            //     spam_mark_as_read,
            //     spam_threshold,
            // })
            if (!this.isRunning()) reject("Service inactive.")
            this.api.createUser({
                email,
                raw_password,
                comment,
                quota_bytes,
                global_admin,
                enabled,
                displayed_name,
                spam_enabled,
                spam_mark_as_read,
                spam_threshold,
            })
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    reject("Failed to create user: " + err);
                })
        })
    }

    updateUser(userEmail, {
                   email,
                   raw_password,
                   comment,
                   quota_bytes,
                   global_admin,
                   enabled,
                   change_pw_next_login,
                   enable_imap,
                   enable_pop,
                   allow_spoofing,
                   forward_enabled,
                   forward_destination,
                   forward_keep,
                   reply_enabled,
                   reply_subject,
                   reply_body,
                   reply_startdate,
                   reply_enddate,
                   displayed_name,
                   spam_enabled,
                   spam_mark_as_read,
                   spam_threshold
               }){
        return new Promise((resolve, reject) => {
            if (!this.isRunning()) reject("Service inactive.")
            this.api.updateUser(userEmail, {
                email,
                raw_password,
                comment,
                quota_bytes,
                global_admin,
                enabled,
                change_pw_next_login,
                enable_imap,
                enable_pop,
                allow_spoofing,
                forward_enabled,
                forward_destination,
                forward_keep,
                reply_enabled,
                reply_subject,
                reply_body,
                reply_startdate,
                reply_enddate,
                displayed_name,
                spam_enabled,
                spam_mark_as_read,
                spam_threshold,
            })
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    reject("Failed to create user: " + err);
                })
        })
    }

    getAll(){
        if (!this.isRunning()) throw new Error("Service inactive.");
        return this.api.listUsers();
    }

    getUser(email){
        if (!this.isRunning()) throw new Error("Service inactive.");
        return this.api.getUser(email);
    }

    async syncMailAccounts(){
        if (!this.isRunning()) throw new Error("Service inactive.");
        //creates missing mail accounts and deletes superflous accounts
        const userList = await userService.getAll()
        if (userList === undefined || userList.length === 0) throw new Error("Failed to read users.");

        for (let user of userList) {
            await this.syncUserAccount(user);
        }
    }

    async syncUserAccount(user){
        if (!this.isRunning()) throw new Error("Service inactive.");
        //check that internalEmail is set correctly
        const preferredPrefix = user.generalData.firstName.value + "." + user.generalData.lastName.value
        const preferredEmail =  preferredPrefix + "@unisan-server.de";
        if(user.internalEmail === undefined){
            //find a valid address
            try {
                const address = await this.api.generateValidEmailAddress({prefix: preferredPrefix})
                //set preferred address
                await userService.setInternalEmail(user.id, address);
            }
            catch(err) {
                throw err;
            }
        }

        let mailUser;
        try {
            const mailUserResponse = await this.api.getUser(user.internalEmail);
            if(mailUserResponse.ok) {
                mailUser = JSON.parse(mailUserResponse.body);
            }
        }
        catch(err){
            if(err.response.statusCode === 404) {
                // user not found
                mailUser = undefined;
            }
            else {
                throw new Error("Unable to check user account: Something went wrong (HTTP Status "+ err.response.statusCode + ")");
            }
        }

        if(mailUser) {
            //Email account found, associate token and we are done!
            try{
                const tokenResponse = await this.api.createUserToken(user.internalEmail)
                if(tokenResponse.ok) {
                    //try to parse response
                    const token = JSON.parse(tokenResponse.body).token ?? undefined;
                    if (token !== undefined) {
                        await userService.setEmailToken(user.id, token)
                    }
                }
            }
            catch(err) { throw err;}
        }
        else {
            try {
                //no account, create one!
                const response = await this.createUser({
                    email: user.internalEmail,
                    raw_password: this.generateMailPassword(),
                    comment: "unisan-server ID: " + user._id + ", unisan-server username: " + user.username,
                    displayed_name: user.generalData.firstName.value + " " + user.generalData.lastName.value,
                })
                if(response.ok) {
                    //generate user token
                    mailUser = JSON.parse(response.body);
                }
            }
            catch(err){
                throw new Error("Failed to create user: " + err);
            }
            try {
                const tokenResponse = await this.api.createUserToken(user.internalEmail)
                if(tokenResponse.ok) {
                    //try to parse response
                    const token = JSON.parse(tokenResponse.body).token ?? undefined;
                    if (token !== undefined) {
                        await userService.setEmailToken(user.id, token)
                    }
                }
                else {
                    throw new Error(tokenResponse.error);
                }
            }
            catch(e) {
                throw new Error("Failed to create user mail token: " + err);

            }
            return mailUser;
        }
    }

    async createAccountForUser(userid) {
        if (!this.isRunning()) throw new Error("Service inactive.");
        const user = await userService.getById(userid)
        if(!user) throw new Error('User not found');
        return this.syncUserAccount(user);
    }

    /**
     *
     * @param {String} email
     * @param {String} raw_password
     */
    async updateUserPassword(email, raw_password) {
        let mailUser;
        try{
            const updateResponse = await this.updateUser(email, {raw_password: raw_password});
            if(updateResponse.ok) {
                return true;
            }
            else {
                throw new Error(updateResponse.statusCode)
            }
        }
        catch(err){
            if(err.response.statusCode === 404) {
                throw new Error("Failed to update mail password for user: " + email + " Reason: " + "[" + err.response.statusCode + "] User not found.");

            }
            throw new Error("Failed to update mail password for user: " + email + " Reason: " + err.response.statusCode);

        }
    }

    generateMailPassword(
        length = 20,
        characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$'
    ) {
        return Array.from(crypto.randomFillSync(new Uint32Array(length)))
            .map((x) => characters[x % characters.length])
            .join('')
    }
}

export default new MailService();