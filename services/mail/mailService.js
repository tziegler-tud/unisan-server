import UserService from "../userService.js";
import SystemService from "../SystemService.js";
import 'dotenv/config'
import AbstractService from "../AbstractService.js";
import MailuApiUtility from "./mailuApiUtility.js";
import userService from "../userService.js";

import crypto from "crypto";

/** @import { CreateUserConfig } from './types.js' */
/** @import { UpdateUserConfig } from './types.js' */
/** @import { MailUser } from  './types.js' */

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

    async start(){
        let self = this;
        await this.init();
        if(this.state === self.states.RUNNING) {
            return this;
        }

        this.log("Starting " + this.serviceName + "...\n");
        const mailSettings = this.settings.mail;
        const apiKeySecret = await SystemService.getSecret("mail.apiKey");
        const apiKey = apiKeySecret.value;
        if(mailSettings === undefined || !mailSettings.url || !mailSettings.domain || !apiKey) {
            const msg = "Failed to start " + this.serviceName + ": Invalid settings found for 'mail'";
            this.error(msg);
            throw new Error(msg);
        }
        this.mailDomain = mailSettings.domain;
        this.api = new MailuApiUtility({
            url: mailSettings.url,
            port: mailSettings.port,
            apiKey: apiKey,
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

        if(mailSettings.deleteAccountOnUserDeletion){
            UserService.addPostUserDeleteHookAsync(async (args)=> {
                if(!args.user || !args.user.internalEmail) return {result: 0, data: {}};
                try {
                    const deleteResponse = await this.api.deleteUser(args.user)
                    if(deleteResponse.ok){
                        return {result: 1, data: args.user};
                    }
                    else return {result: 0, data: {}};
                }
                catch(err) {
                    return  {result: 0, data: {}};
                }
            }, {})
        }
        this.setStarted();
        return this;
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

    deleteUser(email){
        if (!this.isRunning()) throw new Error("Service inactive.");
        return this.api.deleteUser(email);    }

    async syncMailAccounts(){
        if (!this.isRunning()) throw new Error("Service inactive.");
        //creates missing mail accounts and deletes superflous accounts
        const userList = await userService.getAll()
        if (userList === undefined || userList.length === 0) throw new Error("Failed to read users.");

        for (let user of userList) {
            await this.syncUserAccount(user);
        }
    }

    /**
     *
     * @param {User} user
     * @param replaceToken - if the user account exists already, settings this to true will create a new token and assign it to the user
     * @param strictAddress - If the preferred address is unavailable, this function will try to find a valid variant address. Set to true to disable.
     * @returns {Promise<*|undefined>}
     */
    async syncUserAccount(user, {replaceToken=false, strictAddress=false}){
        if (!this.isRunning()) throw new Error("Service inactive.");
        //check that internalEmail is set correctly
        const preferredPrefix = user.generalData.firstName.value + "." + user.generalData.lastName.value
        const preferredEmail =  preferredPrefix + "@unisan-server.de";
        if(user.internalEmail === undefined){
            //find a valid address
            try {
                const address = await this.api.generateValidEmailAddress({prefix: preferredPrefix, retry: !strictAddress})
                //set preferred address
                await userService.setInternalEmail(user.id, address);
            }
            catch(err) {
                throw err;
            }
        }

        let mailUser = await this.checkMailAccountExists(user.internalEmail);

        if(mailUser !== undefined) {
            if(replaceToken){
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
                //account found, but token is not to be replaced
                return mailUser;
            }

        }
        else {
            //no account, create one!
            try {
                const response = await this.createUser({
                    email: user.internalEmail,
                    raw_password: this.generateMailPassword(),
                    comment: "unisan-server ID: " + user._id + ", unisan-server username: " + user.username,
                    displayed_name: user.generalData.firstName.value + " " + user.generalData.lastName.value,
                })
                if(response.ok) {
                    mailUser = JSON.parse(response.body);
                }
            }
            catch(err){
                throw new Error("Failed to create user: " + err);
            }
            // account creation successfull, now create token and associate
            try {
                //generate user token
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
        }
        return mailUser
    }

    async createAccountForUser(userid) {
        if (!this.isRunning()) throw new Error("Service inactive.");
        const user = await userService.getById(userid)
        if(!user) throw new Error('User not found');
        return this.syncUserAccount(user, {strictAddress: true});
    }

    async recreateAccountToken(userid) {
        if (!this.isRunning()) throw new Error("Service inactive.");
        const user = await userService.getById(userid)
        if(!user) throw new Error('User not found');
        return this.syncUserAccount(user, {replaceToken: true, strictAddress: true});
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

    /**
     *
     * @param address {string}
     */
    async createSystemAccount(address){
        let mailUser = await this.checkMailAccountExists(address)

        if(mailUser !== undefined) {
            //Account exists - abort action. We do not create a new token here.
            return mailUser;
        }
        else {
            try {
                //no account, create one!
                const password = this.generateMailPassword();
                const response = await this.createUser({
                    email: address,
                    raw_password: password,
                    comment: "unisan-server system account. Created: " + new Date().toISOString(),
                    displayed_name: "unisan-server",
                })
                if(response.ok) {
                    //generate user token
                    await SystemService.set({key: "mail", value: {systemMailAccount: address, systemMailAccountPassword: password}});
                    mailUser = JSON.parse(response.body);
                }
            }
            catch(err){
                throw new Error("Failed to create user: " + err);
            }
            //create token and associate
            try {
                const tokenResponse = await this.api.createUserToken(address)
                if(tokenResponse.ok) {
                    //try to parse response
                    const token = JSON.parse(tokenResponse.body).token ?? undefined;
                    if (token !== undefined) {
                        await SystemService.set({key: "mail", value: {systemMailAccountToken: token}});
                    }
                }
                else {
                    throw new Error(tokenResponse.error);
                }
            }
            catch(e) {
                throw new Error("Failed to create user mail token: " + err);

            }
        }
        return mailUser
    }

    async recreateSystemAccountToken(){
        const address = SystemService.getSettings().mail?.systemMailAccount;
        if (address === undefined) throw new Error("Failed to recreate system account token: Invalid system mail account setting found.")
        let mailUser = await this.checkMailAccountExists(address)
        if(mailUser === undefined) {
            // Account not found - smt went wrong here. Throw an error
            throw new Error("Failed to recreate system account token: Mail account not found on server: " + address);
        }
        try {
            const tokenResponse = await this.api.createUserToken(address)
            if(tokenResponse.ok) {
                //try to parse response
                const token = JSON.parse(tokenResponse.body).token ?? undefined;
                if (token !== undefined) {
                    await SystemService.set({key: "mail", value: {systemMailAccountToken: token}});
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

    /**
     *
     * @param address
     * @returns {Promise<MailUser | undefined>}
     * @throws Error throws if mail server responds with something else than 200 or 404
     */
    async checkMailAccountExists(address){
        let mailUser = undefined;
        try {
            const mailUserResponse = await this.api.getUser(address);
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
        return mailUser
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