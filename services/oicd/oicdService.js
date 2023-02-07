import express from 'express';
var router = express.Router();
import bcrypt from 'bcrypt';
import bodyParser from "body-parser";
import passport from 'passport';
import Provider from "oidc-provider";
import MongooseAdapter from "./mongooseAdapter.js";
import routes from "./routes.js";
import Account from "./account.js";
import UserService from "../userService.js";


class OidcService {
    constructor(){

        // const { PORT = 3000, ISSUER = "https://unisan-server.de"} = process.env;
        this.port = 3000;
        this.issuer = "https://3185-95-91-4-57.eu.ngrok.io";

        this.config = {};

        //oicd provider
        this.config.claims = {
            address: ['address'],
            email: ['email', 'email_verified'],
            phone: ['phone_number', 'phone_number_verified'],
            profile: ['birthdate', 'family_name', 'gender', 'given_name', 'locale', 'middle_name', 'name',
                'nickname', 'picture', 'preferred_username', 'profile', 'updated_at', 'website', 'zoneinfo'],
        }
        this.config.cookies = {
            cookies: {
                keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],
            },
        }

        this.url = "/oicd";
        this.init = this.init();

    }

    init(){
        let self = this;
        return new Promise(function(resolve, reject){
            console.log("Initializing Oauth2 provider service...\n");
            function findAccount(ctx, id, token) {
                return new Promise(function(resolve, reject){
                    UserService.getByUsername(id)
                        .then(user=> {
                            if(user){
                                let result = {
                                    accountId: user.username,
                                    scope: undefined,
                                    rejected: undefined,
                                    async claims(use, scope, claims, rejected) { return { sub: id }; },
                                };
                                resolve( result);
                            }
                        })


                })
            }

            const configuration = {
                adapter: MongooseAdapter,
                // ... see the available options in Configuration options section
                clients: [{
                    client_id: 'moodle_local',
                    client_secret: 'moodleSecret',
                    redirect_uris: ['http://localhost:8000/admin/oauth2callback.php'],
                    // + other client properties
                },
                    {
                        client_id: 'test_client',
                        client_secret: 'test_secret',
                        redirect_uris: ['https://oauthdebugger.com/debug'],
                        // + other client properties
                    }],
                interactions: {
                    url : function interActionsUrl(ctx, interaction) { // eslint-disable-line no-unused-vars
                        return "/oicdIt/interaction/" + interaction.uid;
                    },
                },
                features: {
                    devInteractions: { enabled: true }, // defaults to true

                    deviceFlow: { enabled: true }, // defaults to false
                    revocation: { enabled: true }, // defaults to false
                },
                claims: self.config.claims,
                cookies: self.config.cookies,
                findAccount: findAccount,
                pkce: {
                    required: function pkceRequired(ctx, client) {
                        return false;
                    }
                }
            };

            const provider = new Provider(self.issuer, configuration);
            provider.proxy = true;
            let server = express();
            // routes(server, provider)
            // server.use(self.url, provider.callback());

            self.provider = provider;
            console.log("Oauth2 provider service running at " + self.issuer + self.url);
            resolve(self);
        })
    }

    getProvider(){
        this.init.then(()=>{
            return this.provider;
        })
    }




}



export default new OidcService();