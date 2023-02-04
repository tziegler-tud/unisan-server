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

        const { PORT = 3000, ISSUER = "https://unisan-server.de"} = process.env;
        this.port = PORT;
        this.issuer = ISSUER;

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
                    UserService.getById(id)
                        .then(user=> {
                            if(user){
                                let result = {
                                    accountId: user.id,
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
                    redirect_uris: ['127.0.0.1:8000'],
                    // + other client properties
                },
                    {
                        client_id: 'test_client',
                        client_secret: 'test_secret',
                        redirect_uris: ['localhost:8000'],
                        // + other client properties
                    }],
                interactions: {
                    url(ctx, interaction) { // eslint-disable-line no-unused-vars
                        return "oidc/interaction/" + interaction.uid;
                    },
                },
                features: {
                    devInteractions: { enabled: false }, // defaults to true

                    deviceFlow: { enabled: true }, // defaults to false
                    revocation: { enabled: true }, // defaults to false
                },
                claims: self.claims,
                cookies: self.cookies,
                findAccount: Account.findAccount,
            };

            const provider = new Provider(self.issuer, configuration);

            let server = express();
            // routes(server, provider)
            server.use(self.url, provider.callback());

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