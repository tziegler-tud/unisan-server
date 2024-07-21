import SystemService from "./SystemService.js";

export default class AbstractService {
    #startupResolve;
    #startupReject;
    #initResolve;
    #initReject;

    constructor() {
        this.serviceName = "AbstractService";
        this.consolePrefix = "AbstractService";
        this.states = {
            STOPPED: "stopped",
            NOTSTARTED: "notStarted",
            STARTING: "starting",
            RUNNING: "running",
            FAILED: "failed",
        }

        this.config = {};

        this.starting = false;
        this.state = this.states.NOTSTARTED;

        this.initPromise = new Promise((resolve, reject) => {
            this.#initResolve = resolve;
            this.#initReject = reject;
        }).then().catch(err => this.error("Failed to initialize " + this.serviceName + ": " + err))
        this.startupPromise = new Promise((resolve, reject) => {
            this.#startupResolve = resolve;
            this.#startupReject = reject;
        }).then().catch(err => this.error("Failed to start " + this.serviceName + ": " + err))
    }

    setStarted(){
        this.log(this.serviceName + " started successfully.")
        this.state = this.states.RUNNING;
        this.#startupResolve();
    }

    setStopped() {
        this.state === this.states.STOPPED;
    }

    getState(){
        return this.state;
    }

    getStatus(){
        return this.getState();
    }

    init(){
        let self = this;
        return new Promise(function(resolve, reject){
            const system = SystemService.getSystemInformation()
        })
    }

    start(){
        let self = this;
        this.starting = new Promise((resolve, reject) => {
            this.initPromise
                .then(()=>{
                    if(this.state === self.states.RUNNING) {
                        resolve(this);
                    }
                    else {
                        this.log("Cannot load abstract service " + this.serviceName + "...\n");
                    }
                })
                .catch(err=>{
                    reject(err);
                })
        })
        return this.starting;
    }

    restart(){
        return new Promise((resolve, reject) => {
            this.log("Restarting "+ this.serviceName + "\n");
            const msg = "Failed to restart " + this.serviceName + ": ";

            if(this.state === this.states.RUNNING){
                this.stop()
                    .then(()=>{
                        this.start()
                            .then(()=>{
                                resolve();
                            })
                            .catch(err=> {
                                this.error(msg + err)
                                reject(new Error(msg + err));
                            })
                    })
            }
            else {
                this.start()
                    .then(()=>{
                        resolve();
                    })
                    .catch(err=> {
                        this.error(msg + err)
                        reject(new Error(msg + err));
                    })
            }

        })
    }

    stop(){
        return new Promise((resolve, reject) => {
            this.log("Stopping "+ this.serviceName + "...\n");
            this.provider = undefined;
            this.state = this.states.STOPPED;
            resolve();
        })
    }

    awaitStartup(){
        return this.startupPromise;
    }

    isRunning(){
        return (this.state === this.states.RUNNING);
    }

    /**
     *
     * @param {string} message
     */
    log(message) {
        console.log("["+this.consolePrefix+"] " + message);
    }

    /**
     * @param {string} message
     */
    warn(message) {
        console.warn("["+this.consolePrefix+"] WARNING:" + message);
    }

    /**
     *
     * @param {string} message
     */
    error(message) {
        console.error("["+this.consolePrefix+"] ERROR:" + message);
    }
}