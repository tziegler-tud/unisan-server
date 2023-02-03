import express from 'express';
var router = express.Router();
import bcrypt from 'bcrypt';
import bodyParser from "body-parser";
import passport from 'passport';
import ProviderModule from "oidc-provider";

class OidcService {
    constructor(){

        const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env;
//oicd provider

        const claims = {
            address: ['address'],
            email: ['email', 'email_verified'],
            phone: ['phone_number', 'phone_number_verified'],
            profile: ['birthdate', 'family_name', 'gender', 'given_name', 'locale', 'middle_name', 'name',
                'nickname', 'picture', 'preferred_username', 'profile', 'updated_at', 'website', 'zoneinfo'],
        }
        const cookies = {
            cookies: {
                keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],
            },
        }

        function findAccount(ctx, id, token) {
            return new Promise(function(resolve, reject){
                //auth user
                passport.authenticate('local', {}, (err, user, info) => {
                    if (!user) {
                    }
                })
                let result = {
                    accountId: id,
                    scope: undefined,
                    rejected: undefined,
                    async claims(use, scope, claims, rejected) { return { sub: id }; },
                };
                resolve( result);
            })
        }

        const configuration = {
            // ... see the available options in Configuration options section
            clients: [{
                client_id: 'moodle_local',
                client_secret: 'moodleSecret',
                redirect_uris: ['localhost:8000'],
                // + other client properties
            }],
            interactions: {
                url(ctx, interaction) { // eslint-disable-line no-unused-vars
                    return "oidc/interaction/" + interaction.uid;
                },
            },
            claims: claims,
            cookies: cookies,
            findAccount: findAccount,
        };

        ProviderModule.then(module => {
            const Provider = module;
            const oidc = new Provider(ISSUER, configuration);

            var router = express.Router();
// express/nodejs style application callback (req, res, next) for use with express apps, see /examples/express.js
            router.use('/', oidc.callback());
// with express
            router.get('/interaction/:uid', async (req, res) => {
                const details = await oidc.interactionDetails(req, res);
                // ...
            });

// with express
            router.post('/interaction/:uid/login', async (req, res) => {
                return oidc.interactionFinished(req, res, result); // result object below
            });

            router.post('/interaction/:uid/login', async (req, res) => {
                const redirectTo = await oidc.interactionResult(req, res, result);

                res.send({ redirectTo });
            });

            express().use("/oidc", router);
        })
            .catch(err => {
                throw new Error(err);
            })

    }
}



module.exports = new OidcService();