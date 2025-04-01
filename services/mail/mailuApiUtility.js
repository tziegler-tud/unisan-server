import got from "got";
import * as Types from "./types.js";

/** @import { CreateUserConfig } from './types.js' */
/** @import { UpdateUserConfig } from './types.js' */


export default class MailuApiUtility {
    constructor({url, port=80, apiKey, baseUrl = "/api/v1", domain}={}) {
        this.url = url;
        this.port = port;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.domain = domain
    }

    /**
     *
     * @returns {Promise<Response>}
     */
    listUsers(){
        return this.get("user");
    }

    /**
     *
     * @param {CreateUserConfig} createUserConfig
     * @returns {Promise<Response>}
     */
    createUser(createUserConfig){
        //strip undefined fields
        Object.keys(createUserConfig).forEach((key)=>{
            if(createUserConfig[key] === undefined){
                delete createUserConfig[key]
            }
        })
        return this.post("user", createUserConfig)
    }

    /**
     *
     * @param {string} email
     */
    getUser(email){
        return this.get("user/"+email);
    }

    getAllUser(){
        return this.get("user");
    }

    /**
     *
     * @param {string} email
     */
    deleteUser(email){
        return this.sendRequest({method: "DELETE", url: "user/"+email});
    }

    /**
     *
     * @param {string} email
     * @param {UpdateUserConfig} updateUserConfig
     */
    updateUser(email, updateUserConfig){
        Object.keys(updateUserConfig).forEach((key)=>{
            if(updateUserConfig[key] === undefined){
                delete updateUserConfig[key]
            }
        })
        return this.sendRequest({method: "PATCH", url: "user/"+email, data: updateUserConfig});
    }

    getUserTokens(email){
        return this.get("tokenuser/"+email);
    }
    createUserToken(email){
        return this.post("tokenuser/"+email);
    }

    /**
     *
     * @param method POST, GET, PUT, DELETE
     * @param url url part after the base api endpoint. Must begin with /
     * @param data data object, will be sent as json
     * @returns {Promise<Response>}
     */
    sendRequest({method, url, data}={}){
        return got({
            prefixUrl: "http://" + this.url + ":" + this.port + this.baseUrl,
            url: url,
            method: method,
            json: data,
            headers: {
                Authorization: this.apiKey,
            }
        });
    }

    /**
     *
     * @param url url part after the base api endpoint. Must begin with /
     * @returns {Promise<Response>}
     */
    get(url){
        return this.sendRequest({
            method: "GET",
            url: url,
        });
    }

    /**
     *
     * @param url url part after the base api endpoint. Must begin with /
     * @param data data object, will be sent as json
     * @returns {Promise<Response>}
     */
    post(url, data={}){
        return this.sendRequest({
            method: "POST",
            url: url,
            data: data,
        });
    }

    async generateValidEmailAddress({prefix, counter=0, retry=true, retryLimit=5}){
        let delimiter = "@";
        if(counter > 0) {delimiter = counter+delimiter}
        //sanitize prefix
        const replacements = {
            'ä': 'ae',
            'ö': 'oe',
            'ü': 'ue',
            'ß': 'ss',
        };

        return prefix.normalize('NFC').replace(/[äöüß]/g, match => replacements[match]);

        let fullAddress = prefix + delimiter + this.domain;
        try {
            let response = await this.getUser(fullAddress)
            if(response.ok && retry) {
                counter++;
                if(counter >= retryLimit) throw new Error("Unable to find a valid email address for user: Maximum retry count exceeded ("+retryLimit+").");
                return this.generateValidEmailAddress({prefix:prefix, counter: counter, retry: retry})
            }
        }
        catch(err) {
            if(err.response.statusCode === 404) {
                // Address available
                return fullAddress
            }
            else {
                throw new Error("Unable to find a valid email address for user: Something went wrong (HTTP Status "+ response.statusCode + ")");
            }
        }
        //if 404 is returned, address is available
        //if 200 is returned the address is taken
        //any other response indicates an error in the communication
    }
}