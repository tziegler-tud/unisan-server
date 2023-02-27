import express from 'express';
var router = express.Router();
import bcrypt from 'bcrypt';
import bodyParser from "body-parser";
import passport from 'passport';
import Provider from "oidc-provider";
import MongooseAdapter from "./mongooseAdapter.js";
import UserService from "../userService.js";


class OidcService {
    constructor(){

        // const { PORT = 3000, ISSUER = "https://unisan-server.de"} = process.env;
        // this.port = 80;
        // this.issuer = "https://3c99-95-91-4-57.eu.ngrok.io";


        this.issuer = "http://127.0.0.1";
        this.port = 3000;

        this.config = {};

        //oidc provider
        this.config.claims = {
            username: ["id", "username"],
            email: ['email'],
            profile: ['username', 'family_name', 'given_name', 'locale', 'name', 'updated_at'],
            picture: ['picture'],
        }
        this.config.cookies = {
            cookies: {
                keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],
            },
        }

        this.url = "/oidc";
        this.serverUrl = this.issuer + ":" + this.port;
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
                                    async claims(use, scope, claims, rejected) { return {
                                        sub: id,
                                        email: user.internalEmail,
                                        username: user.username,
                                        given_name: user.generalData.firstName.value,
                                        family_name: user.generalData.lastName.value,
                                        // picture: self.issuer + "/data/uploads/user_images/" + user.id + "/" + user.id + ".jpg",
                                        picture: self.issuer + "/data/uploads/user_images/" + user.id + "/" + user.id + ".jpg",
                                        // picture: "https://static.wikia.nocookie.net/lotr/images/8/8d/Gandalf-2.jpg/revision/latest?cb=20130209172436",
                                        };
                                    },
                                };
                                resolve( result);
                            }
                        })


                })
            }

            async function renderError(ctx, out, error) {
                ctx.type = 'html';
                ctx.body = `<!DOCTYPE html>
                    <head>
                      <title>oops! something went wrong</title>
                    </head>
                    <body>
                      <div>
                        <h1>oops! something went wrong</h1>
                        
                      </div>
                      <h1>Stack:</h1>        
                      <span>${error.stack}</span>               
                     </body>
                    </html>`;
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
                        client_id: 'moodle_local_https',
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
                        return "/oidcIt/interaction/" + interaction.uid;
                    },
                },
                features: {
                    devInteractions: { enabled: false }, // defaults to true

                    deviceFlow: { enabled: true }, // defaults to false
                    revocation: { enabled: true }, // defaults to false
                },
                renderError: renderError,
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