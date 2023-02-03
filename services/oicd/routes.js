/* eslint-disable no-console, camelcase, no-unused-vars */
import { strict as assert } from 'node:assert';
import * as querystring from 'node:querystring';
import { inspect } from 'node:util';
import { urlencoded } from 'express'; // eslint-disable-line import/no-unresolved
import {SessionNotFound} from "oidc-provider/lib/helpers/errors.js";

import Account from './account.js';


const body = urlencoded({ extended: false });

const keys = new Set();
const debug = (obj) => querystring.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
    keys.add(key);
    if (!value) return acc;
    acc[key] = inspect(value, { depth: null });
    return acc;
}, {}), '<br/>', ': ', {
    encodeURIComponent(value) { return keys.has(value) ? `<strong>${value}</strong>` : value; },
});

export default (app, provider) => {
    if(!provider){
        provider = {
                    constructor: {
                        errors: {

                        }
                    }
                }
    }

    function setNoCache(req, res, next) {
        res.set('cache-control', 'no-store');
        next();
    }

    app.get("/test", function(req, res, next){
        console.log("hit the test endpoint")
        res.status(200).json({message: "test endpoint"})
    })

    app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
        try {
            const {
                uid, prompt, params, session,
            } = await provider.interactionDetails(req, res);

            const client = await provider.Client.find(params.client_id);

            switch (prompt.name) {
                case 'login': {
                    return res.render('login', {
                        client,
                        uid,
                        details: prompt.details,
                        params,
                        title: 'Sign-in',
                        session: session ? debug(session) : undefined,
                        dbg: {
                            params: debug(params),
                            prompt: debug(prompt),
                        },
                    });
                }
                case 'consent': {
                    return res.render('oicd/interaction', {
                        client,
                        uid,
                        details: prompt.details,
                        params,
                        title: 'Authorize',
                        session: session ? debug(session) : undefined,
                        dbg: {
                            params: debug(params),
                            prompt: debug(prompt),
                        },
                    });
                }
                default:
                    return undefined;
            }
        } catch (err) {
            return next(err);
        }
    });

    app.post('/interaction/:uid/login', setNoCache, body, async (req, res, next) => {
        try {
            const details = await provider.interactionDetails(req, res);
            const name = details.name;
            assert.equal(name, 'login');
            const account = await Account.findByLogin(req.body.login);

            const result = {
                login: {
                    accountId: account.accountId,
                },
            };

            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        } catch (err) {
            next(err);
        }
    });

    app.post('/interaction/:uid/confirm', setNoCache, body, async (req, res, next) => {
        try {
            const interactionDetails = await provider.interactionDetails(req, res);
            const { prompt: { name, details }, params, session: { accountId } } = interactionDetails;
            assert.equal(name, 'consent');

            let { grantId } = interactionDetails;
            let grant;

            if (grantId) {
                // we'll be modifying existing grant in existing session
                grant = await provider.Grant.find(grantId);
            } else {
                // we're establishing a new grant
                grant = new provider.Grant({
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
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
        } catch (err) {
            next(err);
        }
    });

    app.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
        try {
            const result = {
                error: 'access_denied',
                error_description: 'End-User aborted interaction',
            };
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        } catch (err) {
            next(err);
        }
    });

    app.use((err, req, res, next) => {
        if (err instanceof SessionNotFound) {
            // handle interaction expired / session not found error
        }
        next(err);
    });
};
