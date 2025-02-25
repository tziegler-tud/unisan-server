import express from 'express';
var router = express.Router();
import Provider from "oidc-provider";
import MongooseAdapter from "./mongooseAdapter.js";
import UserService from "../userService.js";
import SystemService from "../SystemService.js";
import { nanoid } from 'nanoid'
import 'dotenv/config'
import pug from 'pug';



import db from '../../schemes/mongo.js';
import KeyManager from "./keyManager.js";
import AclService from "../aclService.js";
const OidcClient = db.OidcClient;
const OidcAccount = db.OidcAccount;



class OidcService {
    #startupResolve;
    #startupReject;
    #initResolve;
    #initReject;

    constructor({keyPath="/config/keys.json"}={}){

        // const { PORT = 3000, ISSUER = "https://unisan-server.de"} = process.env;
        // this.port = 80;
        // this.issuer = "https://3c99-95-91-4-57.eu.ngrok.io";

        this.states = {
            STOPPED: "stopped",
            NOTSTARTED: "notStarted",
            STARTING: "starting",
            RUNNING: "running",
            FAILED: "failed",
        }


        this.issuer = SystemService.hostname;
        this.port = SystemService.port;

        this.config = {};

        this.claims = {
            openid: {
                description: "Login-Zugang"
            },
            username: {
                fields: ["id", "username"],
                description: "ID, Nutzername"
            },
            email: {
                fields: ["email"],
                description: "Emailadresse"
            },
            profile: {
                fields: ['id', 'username', 'family_name', 'given_name', 'locale', 'name', 'full_name', 'updated_at'],
                description: "ID, Nutzername, Vorname, Nachname"
            },
            picture: {
                fields: ['picture'],
                description: "Profilbild"
            },
            groups: {
                fields: ['groups'],
                description: "Nutzergruppen"
            }
        }

        //oidc provider
        this.config.claims = {
            username: this.claims.username.fields,
            email: this.claims.email.fields,
            profile: this.claims.profile.fields,
            picture: this.claims.picture.fields,
            groups: this.claims.groups.fields,
        }
        this.config.cookies = {
            keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],
        }

        this.config.jwks = {};

        this.url = "/oidc";
        this.interactionsUrl = "/oidcIt";
        this.getServerUrl = function(){
            return this.issuer + ((this.port.toString() !== "80") ? ":"+this.port : "");
        };

        this.keyPath = keyPath;
        this._keyManager = undefined;

        this.logoutSource = async function logoutSource(ctx, form) {
            // @param ctx - koa request context
            // @param form - form source (id="op.logoutForm") to be embedded in the page and submitted by
            ctx.body = buildLogoutSource(form);
        }

        this.logoutSuccessSource = async function postLogoutSuccessSource(ctx) {
            // @param ctx - koa request context
            ctx.body = buildLogoutSuccessSource(ctx.oidc.client, {homeurl: self.getServerUrl()})
        }

        this.renderError = async function renderError(ctx, out, error) {
            ctx.type = 'html';
            const compiledFunction = pug.compileFile(appRoot + '/views/oidc/error.pug', {});
            const html = compiledFunction({error: error, homeurl: self.getServerUrl()});
            ctx.body = html
        }


        this.findAccount = async function(ctx, id, token) {
            const user = await UserService.getById(id)
            if(user){
                let groups = await AclService.getUserGroups(id, {populate: false, json: true})
                groups = groups.map(group => group.toString());
                let result = {
                    accountId: user.id,
                    scope: undefined,
                    rejected: undefined,
                    async claims(use, scope, claims, rejected) { return {
                        sub: id,
                        id: user.id,
                        email: user.internalEmail,
                        username: user.username,
                        given_name: user.generalData.firstName.value,
                        family_name: user.generalData.lastName.value,
                        full_name: user.generalData.firstName.value + " " + user.generalData.lastName.value,
                        groups: groups,
                        // picture: self.issuer + "/data/uploads/user_images/" + user.id + "/" + user.id + ".jpg",
                    };
                    },
                };
                return result
            }
        }

        this.starting = false;
        this.state = this.states.NOTSTARTED;

        let self = this;

        this.initPromise = new Promise(function(resolve, reject){
            self.#initResolve = resolve;
            self.#initReject = reject;
        }).then().catch(err => console.log(err))
        this.startupPromise = new Promise(function(resolve, reject){
            self.#startupResolve = resolve;
            self.#startupReject = reject;
        }).then().catch(err => console.log(err))


        this.providerHandler = function(){
            return false;
        }


    }

    getState(){
        return this.state;
    }

    getClaims() {
        return this.claims;
    }

    loadStaticClients() {
        return new Promise(function(resolve, reject){
            resolve([])
        })
    }

    addClient({name, client_id, redirect_uris, post_logout_redirect_uris, enabled=true}){
        return new Promise(function(resolve, reject){
            //generate client secret
            const client_secret = nanoid();

            //create new client
            let clientData = {
                name: name,
                client_id: client_id,
                client_secret: client_secret,
                redirect_uris: redirect_uris,
                post_logout_redirect_uris: post_logout_redirect_uris,
                enabled: enabled,
            }
            let client = new OidcClient(clientData);
            client.save()
                .then(result => {
                    resolve(result);
                })
        })
    }

    updateClient(id, {name, client_id, redirect_uris, post_logout_redirect_uris, enabled}){
        return new Promise(function(resolve, reject){
            OidcClient.findById(id)
                .then(client => {
                    let clientData = {
                        name: name ?? client.name,
                        client_id: client_id ?? client.client_id,
                        redirect_uris: redirect_uris ?? client.redirect_uris,
                        post_logout_redirect_uris: post_logout_redirect_uris,
                        enabled: enabled ?? client.enabled,
                    }
                    client = Object.assign(client, clientData)

                    client.save()
                        .then(result => {
                            resolve(result);
                        })
                })
        })
    }

    removeClient(id){
        return OidcClient.findByIdAndRemove(id)
    }

    getClients(){
        return OidcClient.find().select("-client_secret");
    }

    getClient(dbId){
        return OidcClient.findById(dbId).select("-client_secret");
    }

    getClientByClientId(clientId){
        return OidcClient.findOne({client_id: clientId}).select("-client_secret");
    }

    getClientSecret(clientId){
        return new Promise(function(resolve, reject){
            OidcClient.findById(clientId).lean()
                .then(client => {
                    resolve(client.client_secret)
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    async getUserSessions(userId){
        if(!this.isRunning()) {
            return [];
        }
        //find session with accountId
        const sessions = await OidcAccount.find({model: "Session", "payload.accountId": userId});
        return sessions;
    }
    async deleteUserSession(userId, sessionid){
        if(!this.isRunning()) {
            return [];
        }
        //find session with accountId
        const session = await OidcAccount.findOne({_id: sessionid, "model": "Session", "payload.accountId": userId});
        if(session) {
            await session.deleteOne();
            return {success: true}
        }
        else {
            throw new Error("Session not found or not owned by requesting user.");
        }
    }

    /**
     *
     * @param index {Number} positional index (0-based) to insert key at. Ignored if positionString is given.
     * @param positionString {String} Can be 'first' or 'last'. Takes precedence to index argument
     * @returns {Promise<number>} index of added element
     */
    async addEncryptionKey({index, positionString}={}){
        let self = this;
        const errMsg = "OidcService: Failed to add encryption key. Error: ";
        try{
            await self.initPromise;
        }
        catch(e) {
            console.error(errMsg + "OidcService failed to initialize");
        }

        return await self.keyManager.addKey({index, positionString});
    }

    /**
     *
     * @param kid {String} jwk key id
     * @param index {number} index to move to
     * @returns {Promise<number>} the new index
     */
    async moveEncryptionKey({kid, index}){
        let self = this;
        const errMsg = "OidcService: Failed to add encryption key. Error: ";
        try{
            await self.initPromise;
        }
        catch(e) {
            console.error(errMsg + "OidcService failed to initialize");
        }

        return await self.keyManager.moveKey({kid, index});
    }

    /**
     *
     * @param kid {String} jwk key id
     * @returns {Promise<number>} the removed index
     */
    async deleteEncryptionKey({kid}={}){
        let self = this;
        const errMsg = "OidcService: Failed to remove encryption key. Error: ";
        try{
            await self.initPromise;
        }
        catch(e) {
            console.error(errMsg + "OidcService failed to initialize");
        }

        return await self.keyManager.deleteKey({kid});
    }


    loadConfiguration(){
        let self = this;
        return new Promise(function(resolve, reject){
            self.loadStaticClients()
                .then(staticClients => {
                    //load settings
                    const settings = SystemService.getSettings();
                    const openIdSettings = settings.auth.openid ?? {};
                    if(openIdSettings.cookieSecrets){
                        self.config.cookies.keys = openIdSettings.cookieSecrets;
                    }
                    self.issuer = openIdSettings.issuer ?? self.issuer;
                    self.port = openIdSettings.port ?? self.port;

                    //generate jwks
                    self.keyManager.getJWKS()
                        .then(jwks => {
                            self.config.jwks = jwks;
                            const configuration = buildConfig();
                            resolve(configuration)
                        })
                        .catch(err => {
                            //Failed to get Keys
                            reject(err);
                        })
                    function buildConfig(){
                        return {
                            adapter: MongooseAdapter,
                            // ... see the available options in Configuration options section
                            clients: staticClients,
                            interactions: {
                                url : function interActionsUrl(ctx, interaction) { // eslint-disable-line no-unused-vars
                                    return self.interactionsUrl + "/interaction/" + interaction.uid;
                                },
                            },
                            features: {
                                devInteractions: { enabled: false }, // defaults to true

                                deviceFlow: { enabled: true }, // defaults to false
                                revocation: { enabled: true }, // defaults to false
                                rpInitiatedLogout: {
                                    enabled: true,
                                    logoutSource: self.logoutSource,
                                    postLogoutSuccessSource: self.logoutSuccessSource,
                                },
                            },
                            renderError: self.renderError,
                            claims: self.config.claims,
                            cookies: self.config.cookies,
                            findAccount: self.findAccount,
                            jwks: self.config.jwks,
                            pkce: {
                                required: function pkceRequired(ctx, client) {
                                    return false;
                                }
                            }
                        };
                    }
                })
                .catch(err => {
                    reject(new Error("Failed to load clients"));
                })
        })
    }

    init(){
        let self = this;
        return new Promise(function(resolve, reject){
            const system = SystemService.getSystemInformation()
            self.issuer = system.hostname;
            self.port = system.port;

            //create key manager
            self.keyManager = new KeyManager(self.keyPath);
            //ensure presence of at least one key
            self.keyManager.ensureKeyExists({overwrite: false})
                .then((jwks)=>{
                    self.config.jwks = jwks;
                    self.#initResolve();
                    resolve();
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    start(){
        let self = this;
        this.starting = new Promise(function(resolve, reject){
            self.initPromise
                .then(()=>{
                    if(self.state === self.states.RUNNING) {
                        resolve(self);
                    }
                    else {
                        console.log("Starting Oauth2 provider service...\n");
                        self.loadConfiguration()
                            .then(configuration => {
                                let provider;
                                try {
                                    provider = new Provider(self.issuer, configuration);
                                }
                                catch(e){
                                    const system = SystemService.getSystemInformation()
                                    self.issuer = system.hostname;
                                    provider = new Provider(self.issuer, configuration);
                                }
                                provider.proxy = true;

                                self.provider = provider;
                                self.providerHandler = provider.callback();
                                console.log("Oauth2 provider service running at " + self.issuer + self.url);
                                self.state = self.states.RUNNING;
                                self.#startupResolve();
                                resolve(self);
                            })
                            .catch(err => {
                                const msg = "OidcService: Failed to start service: Unable to load configuration. | " + err;
                                self.state = self.states.FAILED;
                                self.#startupReject();
                                reject(new Error(msg))
                            })
                    }
                })
                .catch(err=>{
                    reject(err);
                })
        })
        return this.starting;
    }

    restart(){
        let self = this;
        return new Promise(function(resolve, reject){
            console.log("Restarting Oauth2 provider service...\n");
            const msg = "Failed to restart OidcService: "

            if(self.state === self.states.RUNNING){
                self.stop()
                    .then(()=>{
                        self.start()
                            .then(()=>{
                                resolve();
                            })
                            .catch(err=> {
                                reject(new Error(msg + err));
                            })
                    })
            }
            else {
                self.start()
                    .then(()=>{
                        resolve();
                    })
                    .catch(err=> {
                        reject(new Error(msg + err));
                    })
            }

        })
    }

    stop(){
        let self = this;
        return new Promise(function(resolve, reject){
            console.log("Stopping Oauth2 provider service...\n");
            self.provider = undefined;
            self.state = self.states.STOPPED;
            resolve();
        })
    }

    handle(req, res, next){
        return this.providerHandler(req, res, next);
    }

    getProvider(){
        if(this.isRunning()) {
            return this.provider;
        }
        else {
            return false;
        }
    }

    awaitStartup(){
        return this.startupPromise;
    }

    isRunning(){
        return (this.state === this.states.RUNNING);
    }

    getStatus(){
        return this.state;
    }
}

function buildLogoutSource(formHtml){

// Compile the source code
    const compiledFunction = pug.compileFile(appRoot + '/views/oidc/logout.pug', {});
    const html = compiledFunction({form: formHtml, test: "test"});
    return html
}

function buildLogoutSuccessSource(client, args){
    const compiledFunction = pug.compileFile(appRoot + '/views/oidc/logoutSuccess.pug', {});
    const html = compiledFunction({homeurl: args.homeurl, client: client});
    return html;
}


export default new OidcService();