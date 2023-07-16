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
 * hooked at /oidc
 */

router.all("/*", handler)

function handler(req, res, next){
    if(!oidcService.isRunning()){
        res.status(503).send()
    }
    else {
        oidcService.handle(req, res, next);
    }
}


export default router;
