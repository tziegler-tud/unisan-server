/* eslint-disable no-console, camelcase, no-unused-vars */
import { strict as assert } from 'node:assert';
import * as querystring from 'node:querystring';
import { inspect } from 'node:util';
import { urlencoded } from 'express'; // eslint-disable-line import/no-unresolved
import {SessionNotFound} from "oidc-provider/lib/helpers/errors.js";

import express from 'express';
const router = express.Router();
import bodyParser from "body-parser";

var app = express();

import oidcService from "../../services/oidc/oidcService.js";
import passport from "passport";


const body = urlencoded({ extended: false });

function setNoCache(req, res, next) {
    res.set('cache-control', 'no-store');
    next();
}

/**
 * hooked at /oidcIt
 */

router.get("/test", function(req, res, next){
    console.log("hit the test endpoint")
    res.status(200).json({message: "test endpoint"})
})


router.get('/interaction/:uid', setNoCache, async (req, res, next) => {
    try {

        const itDetails = await oidcService.provider.interactionDetails(req, res);
        const client_id = itDetails.params.client_id;

        const client = await oidcService.provider.Client.find(client_id);

        //no dynamic clients, so we can lookup additional info about client in our database
        const dbClient = await oidcService.getClientByClientId(client_id);
        if(!dbClient) {
            //client not found. This should not happen.
            let err = new Error("Invalid client information. This is a server error, nothing you can do.");
            next(err);
        }
        switch (itDetails.prompt.name) {
            case 'login': {
                return res.render('oidc/login', {
                    client,
                    client_name: dbClient.name,
                    uid: itDetails.uid,
                    details: itDetails.prompt.details,
                    params: itDetails.params,
                    title: 'OpenID Sign-in | unisan-server.de',

                });
            }
            case 'consent': {
                //read claim descriptions
                const claims = oidcService.getClaims()
                let missingClaims = []
                itDetails.prompt.details.missingOIDCScope.forEach(scope=>{
                    if(claims[scope]){
                        missingClaims.push({
                            scope: scope,
                            fields: claims[scope].fields,
                            description: claims[scope].description,
                        })
                    }
                    else {
                        missingClaims.push({
                            scope: scope,
                            fields: [],
                            description: "",
                        })
                    }
                })

                return res.render('oidc/interaction', {
                    client,
                    client_name: dbClient.name,
                    claims: missingClaims,
                    uid: itDetails.uid,
                    details: itDetails.prompt.details,
                    params: itDetails.params,
                    title: 'OpenID Authorize  | unisan-server.de',
                });
            }
            default:
                return undefined;
        }
    } catch (err) {
        return next(err);
    }
});

router.post('/interaction/:uid/login', setNoCache, body, async (req, res, next) => {
    try {
        const details = await oidcService.provider.interactionDetails(req, res);

        passport.authenticate('local', {}, (err, user, info) => {
            let result = {};
            if (!user) {
                console.warn("login failed");
                result = {
                    error: "access_denied",
                }
            }
            else {
                result = {
                    login: {
                        accountId: user._id.toString(),
                    },
                };
            }

            return oidcService.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        })(req, res, next);

    } catch (err) {
        next(err);
    }
});

router.post('/interaction/:uid/confirm', setNoCache, body, async (req, res, next) => {
    try {
        const interactionDetails = await oidcService.provider.interactionDetails(req, res);
        const { prompt: { name, details }, params, session: { accountId } } = interactionDetails;
        assert.equal(name, 'consent');

        let { grantId } = interactionDetails;
        let grant;

        if (grantId) {
            // we'll be modifying existing grant in existing session
            grant = await oidcService.provider.Grant.find(grantId);
        } else {
            // we're establishing a new grant
            grant = new oidcService.provider.Grant({
                accountId,
                clientId: params.client_id,
            });
        }

        if (details.missingOIDCScope) {
            grant.addOIDCScope(details.missingOIDCScope.join(' '));
        }
        if (details.missingOIDCClaims) {
            grant.addOIDCClaims(details.missingOIDCClaims);
        }
        if (details.missingResourceScopes) {
            for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
                grant.addResourceScope(indicator, scopes.join(' '));
            }
        }

        grantId = await grant.save();

        const consent = {};
        if (!interactionDetails.grantId) {
            // we don't have to pass grantId to consent, we're just modifying existing one
            consent.grantId = grantId;
        }

        const result = { consent };
        await oidcService.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    } catch (err) {
        next(err);
    }
});

router.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
    try {
        const result = {
            error: 'access_denied',
            error_description: 'End-User aborted interaction',
        };
        await oidcService.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
        next(err);
    }
});

router.use((err, req, res, next) => {
    if (err instanceof SessionNotFound) {
        // handle interaction expired / session not found error
    }
    next(err);
})


export default router;
