import express from 'express';
var router = express.Router();
import uuid from 'uuid';
import bodyParser from "body-parser";
import userGroupService from "../../services/userGroupService.js";
import aclService from "../../services/aclService.js";
import AuthService from "../../services/authService.js";
import SystemService from "../../services/SystemService.js";
import OidcService from "../../services/oidc/oidcService.js";
import {transformTimestamp} from "../../helpers/helpers.js";
import MailService from "../../services/mail/mailService.js";

var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


//hooked at /api/v1/system

router.get('/', getSystemInformation);
router.get('/settings', getSystemSettings);
router.post('/settings/update', updateSystemSettings);

router.get('/settings/:key', getSettingsByKey);
router.put('/settings/oidc', updateOidcSettings);
router.put('/settings/mail', updateMailSettings);
router.put('/settings/key', updateSettingsByKey);

router.put('/settings/members/memberid', updateMemberIdSettings);

router.post("/oidc/restart", restartOidcService);
router.post("/oidc/stop", stopOidcService);
router.get("/oidc/status", getOidcServiceStatus);
router.get("/oidc/clients", getOidcClients);
router.get("/oidc/clients/:id", getOidcClient);
router.get("/oidc/secrets/:id", getOidcClientSecret);
router.post("/oidc/clients", addOidcClient);
router.put("/oidc/clients/:id", updateOidcClient);
router.delete("/oidc/clients/:id", removeOidcClient);
router.get("/oidc/cookies/secrets", getOidcCookieSecrets)
router.post("/oidc/cookies/secrets", setOidcCookieSecrets)

router.post("/mail/restart", restartMailService);
router.post("/mail/stop", stopMailService);
router.get("/mail/status", getMailServiceStatus);
router.get("/mail/apiKey", getMailApiKey);
router.post("/mail/apiKey", setMailApiKey);

router.post("/oidc/jwk/add", addJwkKey);
router.post("/oidc/jwk/move", moveJwkKey);
router.delete("/oidc/jwk/delete", deleteJwkKey);

router.get("/oidc/sessions/:userid", getUserSessions)
router.get("/oidc/userSessions", getUserSessionsFriendly)
router.delete("/oidc/userSessions/:sessionid", deleteUserSession)

export default router;

function getSystemInformation(req, res, next){
    let data = SystemService.getSystemInformation();
    res.json(data);

}

function getSystemSettings(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.SYSTEM)
        .then(result => {
            let data = SystemService.getSettings();
            res.json(data);
        })
        .catch(err => {
            next(err);
        })
}

function getSettingsByKey(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.SYSTEM)
        .then(result => {
            let data = SystemService.getSettings();
            let key = req.params.key;
            try{
                if(data[key] !== undefined) {
                    res.json(data);
                }
                else {
                    res.json({})
                }
            }
            catch(e){
                next(e);
            }
        })
        .catch(err => {
            next(err);
        })
}

function updateSettingsByKey(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.SYSTEM)
        .then(result => {
            let data = SystemService.getSettings();
            let key = req.body.key;
            let body = req.body.data;
            SystemService.set({key: key, value: body})
                .then(result => {
                    res.json(result);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function updateSystemSettings(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.SYSTEM)
        .then(result => {
        })
        .catch(err => {
            next(err);
        })
}

function updateMemberIdSettings(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.SYSTEM)
        .then(result => {
            let data = SystemService.getSettings();
            let mode = req.body.mode;
            let offset = req.body.offset;
            SystemService.setMemberIdSettings({mode: mode, offset: offset})
                .then(result => {
                    res.json(result);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function updateOidcSettings(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            let key = "auth.openid";
            let body = req.body;
            if(body.cookieSecrets) SystemService.setSecret("cookieSecrets", body.cookieSecrets)

            SystemService.set({key: key, value: body})
                .then(result => {
                    res.json(result);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function stopOidcService(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.stop()
                .then(result => {
                    res.json({});
                })
                .catch(e => {
                    next(e);
                })
        })
        .catch(err => {
            next(err);
        })
}

function restartOidcService(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.restart()
                .then(result => {
                    res.json({});
                })
                .catch(e => {
                    next(e);
                })
        })
        .catch(err => {
            next(err);
        })
}

function getOidcClients(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.getClients()
                .then(clients => {
                    res.json(clients);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function addOidcClient(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            const clientData = {
                name: req.body.name,
                client_id: req.body.client_id,
                redirect_uris: req.body.redirect_uris,
                post_logout_redirect_uris: req.body.post_logout_redirect_uris,
            }
            OidcService.addClient(clientData)
                .then(client => {
                    res.json(client);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function getOidcClient(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.getClient(req.params.id)
                .then(clients => {
                    res.json(clients);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function getOidcClientSecret(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.getClientSecret(req.params.id)
                .then(clients => {
                    res.json(clients);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function updateOidcClient(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            const clientData = {
                name: req.body.name,
                client_id: req.body.client_id,
                redirect_uris: req.body.redirect_uris,
                post_logout_redirect_uris: req.body.post_logout_redirect_uris,
                enabled: req.body.enabled,
            }
            OidcService.updateClient(req.params.id, clientData)
                .then(client => {
                    res.json(client);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function removeOidcClient(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.removeClient(req.params.id)
                .then(() => {
                    res.json();
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function getOidcServiceStatus(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            const status = OidcService.getStatus();
            res.json({status: status});
        })
        .catch(err => {
            next(err);
        })
}

async function getOidcCookieSecrets(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(async result => {
            const secret = await SystemService.getSecret("oidc.cookieSecrets");
            const val = secret?.value ?? []
            res.json({cookieSecrets: val});
        })
        .catch(err => {
            next(err);
        })
}

async function setOidcCookieSecrets(req, res, next){
    if(req.body?.cookieSecrets === undefined) {
        next();
    }
    const secret = req.body.cookieSecrets;
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(async result => {
            const r = await SystemService.setSecret("oidc.cookieSecrets", secret)
            res.json(r);
        })
        .catch(err => {
            next(err);
        })
}


function addJwkKey(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.addEncryptionKey({index: req.body.index, positionString: req.body.position})
                .then(pos => {
                    res.json({operation: "JWK.addKey", result: "successfull", position: pos});
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function moveJwkKey(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.moveEncryptionKey({kid: req.body.kid, index: req.body.index})
                .then(pos => {
                    res.json({operation: "JWK.moveKey", result: "successfull", position: pos});
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}


function deleteJwkKey(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.deleteEncryptionKey({kid: req.body.kid})
                .then(pos => {
                    res.json({operation: "JWK.deleteKey", result: "successfull", position: pos});
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}


async function updateMailSettings(req, res, next){
    let key = "mail";
    let body = req.body;

    try  {
        await AuthService.auth(req.user, AuthService.operations.system.MAIL)

        if(body.systemMailAccountToken) await SystemService.setSecret("mail.systemMailAccountToken", body.systemMailAccountToken);
        if(body.apiKey) await SystemService.setSecret("mail.apiKey", body.apiKey);

        const result = await SystemService.setMailSettings({
            enabled: body.enabled,
            createAccountOnUserCreation: body.createAccountOnUserCreation,
            deleteAccountOnUserDeletion: body.deleteAccountOnUserDeletion,
            systemMailAccount: body.systemMailAccount,
            url: body.url,
            port: body.port,
            baseUrl: body.baseUrl,
            imap_url: body.imap_url,
            smtp_url: body.smtp_url,
            domain: body.domain
        });
        res.json(result);
    }
    catch(e){
        next(e)
    }
}

async function stopMailService(req, res, next){
    try {
        await AuthService.auth(req.user, AuthService.operations.system.MAIL)
        await MailService.stop()
        await SystemService.set({key: "mail", value: {enabled: false}})
        res.json({});
    }
    catch(e){
        next(e);
    }
}

async function restartMailService(req, res, next){
    try {
        await AuthService.auth(req.user, AuthService.operations.system.MAIL)
        await MailService.restart()
        await SystemService.set({key: "mail", value: {enabled: true}})
        res.json({});
    }
    catch(e){
        next(e);
    }
}

function getMailServiceStatus(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.MAIL)
        .then(result => {
            const status = MailService.getState();
            res.json({status: status});
        })
        .catch(err => {
            next(err);
        })
}

async function getMailApiKey(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(async result => {
            const secret = await SystemService.getSecret("mail.apiKey");
            const val = secret?.value ?? "";
            res.json({apiKey: val});
        })
        .catch(err => {
            next(err);
        })
}

async function setMailApiKey(req, res, next){
    if(req.body?.apiKey === undefined) {
        next();
    }
    const secret = req.body.apiKey;
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(async result => {
            const r = await SystemService.setSecret("mail.apiKey", secret)
            res.json(r);
        })
        .catch(err => {
            next(err);
        })
}

function getUserSessions(req, res, next){
    AuthService.auth(req.user, AuthService.operations.system.AUTH)
        .then(result => {
            OidcService.getUserSessions(req.params.userid)
                .then(sessions => {
                    res.json(sessions);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}

function deleteUserSession(req, res, next){
    AuthService.auth(req.user, AuthService.operations.user.WRITESELF)
        .then(result => {
            OidcService.deleteUserSession(req.user.id, req.params.sessionid)
                .then(result => {
                    res.json(result);
                })
                .catch(err => {
                    next(err);
                })
        })
        .catch(err => {
            next(err);
        })
}


async function getUserSessionsFriendly(req, res, next){
    try {
        await AuthService.auth(req.user, AuthService.operations.user.READSELF)
        const sessions = await OidcService.getUserSessions(req.user.id)
        //extract client information
        if(!Array.isArray(sessions) || sessions.length === 0) {
            res.json([]);
        }
        let friendlySessionArray = [];
        for (const session of sessions) {
            const client_ids = Object.keys(session.payload.authorizations ?? {})
            let clients = [];
            for (const client_id of client_ids) {
                //obtain client information
                const client = await OidcService.getClientByClientId(client_id);
                clients.push(client);
            }
            friendlySessionArray.push({
                _id: session._id,
                uid: session.uid,
                clients: clients,
                created: transformTimestamp(session.payload.iat, "s", "ms"),
                expires: transformTimestamp(session.payload.exp, "s", "ms"),
                login: transformTimestamp(session.payload.loginTs, "s", "ms"),
            })
        }
        res.json(friendlySessionArray);
    }
    catch(err) {
        next(err);
    }
}


// routes