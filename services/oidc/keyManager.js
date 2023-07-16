import fs from "fs";
import * as jose from "jose";
import { nanoid } from 'nanoid'


/**
 *
 */
export default class KeyManager {
    /**
     *
     * @param filePath {String} path relative to appRoot, starting with '/'
     */
    constructor(filePath){
        this.filePath = filePath;
        this.configPath = appRoot + filePath;
        this.fileLock = new FileLock();
    }

    async ensureKeyExists({overwrite=false}={}){
        //try to load config file
        try {
            const jwks = await this._loadJWKS();
            return jwks;
        }
        catch(e){
            //failed to load config. We try to add a key, this should create a new config file if none is present
            const posCheck = await this.addKey();
            return await this._loadJWKS();
        }
    }

    writeFile(lockToken, fileContent){
        let self = this;
        return new Promise(function(resolve, reject) {
            //verify file lock
            self.fileLock.verify(lockToken)
                .then(()=>{
                    fs.writeFile(self.configPath, JSON.stringify(fileContent), function (err) {
                        if (err) reject(err);
                        else resolve()
                    })
                })
                .catch(err => {
                    reject("Failed to write config file: Failed to verify file lock. Error: " + err);
                })
        })
    }

    /**
     * generates a new rsa key and adds it to the JWKS
     *
     * @param index {Number} positional index (0-based) to insert key at. Ignored if positionString is given.
     * @param positionString {String} Can be 'first' or 'last'. Takes precedence to index argument
     * @returns {Promise<number>} index of inserted key
     */
    async addKey({index=0, positionString}={}){
        let self = this;
        const errMsg = "KeyManager: Failed to add encryption key. Error: ";

        //generate new key
        const kid = nanoid();
        const newJWK = await generateJWK(kid);
        let keys = [];
        //load current to see if config file is present
        //await file lock
        const lockToken = await this.fileLock.lock();

        try {
            const config = await this._loadConfig();
            keys = config.jwks.keys;
            const newPos = await addKeyToConfig(newJWK);
            await this.fileLock.unlock(lockToken);
            return newPos;
        }
        catch(err){
            //failed to load config. Try to create a new file.
            const newPos = await createFile(newJWK, {overwrite: false});
            console.log("Created new keyStorage: " + self.filePath);
            await this.fileLock.unlock(lockToken);
            return newPos;
        }

        function createFile(newJWK, {overwrite=false}={}){
            return new Promise(function(resolve, reject){
                if(!newJWK){
                    reject("Failed to create config file: Invalid key given.")
                }
                const keysFile = {
                    jwks: {
                        keys: [newJWK]
                    }
                }
                fs.access(self.configPath, fs.constants.F_OK, (err) => {
                    if(err){
                        //file not present. Create new config file
                        self.writeFile(lockToken, keysFile)
                            .then(()=>{
                                resolve(0);
                            })
                            .catch(err => {
                                reject(err)
                            })
                    }
                    else {
                        fs.access(self.configPath, fs.constants.R_OK | fs.constants.W_OK, (err, data) => {
                            if (err) {
                                //file present, but lacks access rights. Fail.
                                reject("Failed to read/write config file. Check user permissions.");
                            }
                            else {
                                if(overwrite){
                                    self.writeFile(lockToken, keysFile)
                                        .then(()=>{
                                            resolve(0);
                                        })
                                        .catch(err => {
                                            reject(err)
                                        })
                                }
                                else {
                                    reject("Unable to create file: File exists.")
                                }
                            }
                        });
                    }
                });
            })
        }

        /**
         *
         * @param newJWK
         */
        async function addKeyToConfig(newJWK){
            const ogLength = keys.length;
            //add key to array at specified position
            if(positionString){
                switch(positionString){
                    case "last":
                        keys.push(newJWK);
                        break;
                    case "first":
                        keys.unshift(newJWK);
                        break;
                    default:
                        fail("Unexpected value for argument 'positionString': " + positionString);
                }
            }
            else {
                if(index !== undefined && typeof(index) === "number"){
                    //check array bounds
                    if(index < 0){
                        fail("Invalid value for argument 'index': "+ index);
                    }
                    if(index > keys.length) {
                        index = keys.length;
                    }
                    keys.splice(index, 0, newJWK);
                }
            }


            let newPos = keys.findIndex(key => key.kid === newJWK.kid);
            if(!(newPos >= 0 && newPos < keys.length && keys.length === ogLength+1)) fail();
            //write changes to file
            const keysFile = {
                jwks: {
                    keys: keys
                }
            }
            await self.writeFile(lockToken, keysFile)
            return newPos;
        }

        /**
         *
         * @param errMsgDetail {String}
         */
        function fail(errMsgDetail="Add operation failed epically."){
            throw new Error(errMsg + errMsgDetail);
        }
    }


    /**
     *  moves a key to a different index in the JWKS
     * @param kid {String} key id
     * @param index {Number} new index
     * @returns {Promise<number>} the (actual) new index
     */
    async moveKey({kid, index}) {
        let self = this;
        const errMsg = "KeyManager: Failed to move encryption key. Error: ";

        //await file lock
        const lockToken = await this.fileLock.lock();
        //load current to see if config file is present
        const config = await this._loadConfig();
        let keys = config.jwks.keys;
        let ogLength = keys.length;
        //find key position
        let pos = keys.findIndex(key => key.kid === kid);
        //move to new position
        //check array bounds
        if(index < 0){
            fail("Invalid value for argument 'index': "+ index);
        }
        if(index > keys.length) {
            index = keys.length;
        }
        const item = keys.splice(pos, 1);
        if(!Array.isArray(item) || item.length !== 1) fail("Move operation failed epically.")
        keys.splice(index, 0, item[0]);

        //find new position
        let newPos = keys.findIndex(key => key.kid === kid);
        if(!(newPos >= 0 && newPos < keys.length && keys.length === ogLength)) fail("Move operation failed epically.");
        //write changes to file
        const keysFile = {
            jwks: {
                keys: keys
            }
        }
        await self.writeFile(lockToken, keysFile);
        await this.fileLock.unlock(lockToken);
        return newPos;
    }

    async deleteKey({kid}){
        let self = this;
        const errMsg = "KeyManager: Failed to move encryption key. Error: ";

        //await file lock
        const lockToken = await this.fileLock.lock();
        //load current to see if config file is present
        const config = await this._loadConfig();
        let keys = config.jwks.keys;
        let ogLength = keys.length;
        //find key position
        let pos = keys.findIndex(key => key.kid === kid);

        const item = keys.splice(pos, 1);
        if(!Array.isArray(item) || item.length !== 1) fail("Move operation failed epically.")
        //write changes to file
        const keysFile = {
            jwks: {
                keys: keys
            }
        }
        await self.writeFile(lockToken, keysFile);
        await this.fileLock.unlock(lockToken);
        //find new position
        return pos;
    }

    async getKeyPosition(kid){
        const config = await this._loadConfig();
        let keys = config.jwks.keys;
        return keys.findIndex(key => key.kid === kid);
    }

    async getKey(kid){
        const config = await this._loadConfig();
        let keys = config.jwks.keys;
        return keys.find(key => key.kid === kid);
    }

    async getJWKS(){
        try {
            return await this._loadJWKS();
        }
        catch(e){
            throw new Error(e);
        }
    }
    _loadConfig(){
        let self = this;
        return new Promise(function(resolve, reject){
            //try to read from config file
            // Read the JSON file
            fs.readFile(self.configPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(JSON.parse(data));
                }
                // Parse the JSON data
            });
        })
    }

    async _loadJWKS(){

            let config = await this._loadConfig().catch(e=> {
                throw new Error(e);
            })
            const jwks = config.jwks;
            //verify
            if (!verifyJWKS(jwks)){
                //JWKS object is invalid
                const msg = "OidcService: Failed to load JWKS from config: Invalid key format.";
                console.log(msg)
                throw new Error(msg)
            }
            return jwks;


    }
}

async function generateJWK(kid){
    // Generate a key pair
    const key = await jose.generateKeyPair('PS256', {extractable: true})
    // Create a JWK from the generated key pair
    let jwk = await jose.exportJWK(key.privateKey);
    jwk.kid = kid;
    return jwk;
}

function verifyJWKS(jwks){
    if(jwks === undefined) return false;
    if(jwks.keys === undefined || !Array.isArray(jwks.keys) || jwks.keys.length === 0) return false;
    jwks.keys.forEach(key => {
        if(!(key.kid && key.n && key.kty)) return false;
    })
    return true;
}

class FileLock{
    constructor(){
        this.awaitUnlocked = true;
        this.lockToken = undefined;
        this.unlockResolve = undefined;
        this.locked = false;
    }

    isLocked(){
        return this.locked;
    }

    async lock(){
        let self = this;
        await this.awaitUnlocked;
        //create new lockToken
        const token = nanoid();
        this.lockToken = token;
        this.locked = true;
        this.awaitUnlocked = new Promise((resolve, reject)=>{
            self.unlockResolve = resolve;
        })
        return token;
    }

    unlock(lockToken){
        let self = this;
        return new Promise(function(resolve, reject){
            if(!self.unlockResolve){
                self.lockToken = undefined;
                self.awaitUnlocked = true;
                self.locked = false;
                resolve();
            }
            else {
                //verify lock token
                self.verify(lockToken)
                    .then(()=>{
                        self.lockToken = undefined;
                        self.locked = false;
                        self.unlockResolve();
                        resolve();
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    async verify(lockToken){
        if(!this.lockToken){
            throw new Error("Unable to verify lock: No lock present")
        }
        if(this.lockToken === lockToken) return true;
        else throw new Error("Unable to verify lock: Token missmatch.")
    }
}