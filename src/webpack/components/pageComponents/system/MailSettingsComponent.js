import ComponentObserver from "../../ComponentObserver.js";
import Component from "../../Component";
import InteractiveListStandaloneComponent from "../../interactiveListStandalone";
import {systemActions} from "../../../actions/systemActions";
import {systemPlugin} from "../../../sidebar/plugins/plugin-system"
import {escapeRegExp} from "../../../helpers/helpers";

export default class MailSettingsComponent extends Component {
    /**
     *
     * @param page {ComponentPage} parent page instance
     * @param section {ComponentSection}
     * @param componentId {String} component id number, assigend by page on creation
     * @param componentType {ComponentPage.componentTypes} type of the component
     * @param data {Object}
     * @param args {Object}
     * @returns {OpenIdSettingsComponent}
     * @constructor
     */
    constructor({page, section, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, section, componentId, pageData, data, args});
        this.templateUrl = "/webpack/components/templates/system/mailSettings.hbs"
        page.sidebar.addPlugin(systemPlugin)

    }

    async postRender(){
        let self = this;
        //get settings container
        const monitorContainer = this.container.querySelector(".mail-monitor");
        const statusContainer = this.container.querySelector(".mail-status");
        const switchSettingsContainer = this.container.querySelector(".mail-switches");
        const serverSettingsContainer = this.container.querySelector(".mail-serverSettings");
        const accountContainer = this.container.querySelector(".mail-accountSettings");
        const checkAccountExistsButton = document.getElementById("checkAccountExistsButton");
        this._createAccountButton = document.getElementById("createAccountButton");
        this._syncTokenButton = document.getElementById("syncTokenButton");

        this._disableCreateAccountButton();
        this._disableSyncTokenButton();

        //get service status
        let statusRequest = await systemActions.getMailStatus();
        let status = statusRequest.status;

        const monitorLabel = {
            type: "label",
            identifier: "label-service-state",
            valueFunc: function(entry){
                return (entry.value);
            },
            config: {
                classes: ["service-state--label"]
            }
        }
        let monitorData = {
            listEntries: [{label: "Service Status:", value: status}],
            interactions: [monitorLabel]
        }
        let monitorConfig = {
            entryLabel: function(entry){
                return entry.label;
            }
        }

        let monitorList = new InteractiveListStandaloneComponent({element: monitorContainer, config: monitorConfig, data: monitorData});
        monitorList.render();

        //init interactive list subcomponent
        let statusEntries = [{
            label: "Email Integration aktivieren",
            value: (status === "running"),
        }]

        const statusSwitch = {
            type: "switch",
            identifier: "switch-service-enabled",
            valueFunc: function(entry){
                return (entry.value);
            }
        }
        let statusData = {
            listEntries: statusEntries,
            interactions: [statusSwitch]
        }
        let statusConfig = {
            entryLabel: function(entry){
                return entry.label;
            }
        }
        let statusList = new InteractiveListStandaloneComponent({element: statusContainer, config: statusConfig, data: statusData})
        statusList.render();

        function updateStatus(){
            systemActions.getMailStatus()
                .then(statusRequest=> {
                    const status = statusRequest.status;
                    const monitorEntries = [{label: "Service Status:", value: status}]
                    monitorList.setListEntries(monitorEntries)
                    monitorList.render();
                    const updatedStatusEntries = [{
                        label: statusEntries[0].label,
                        value: (status === "running"),
                    }]
                    statusList.setListEntries(updatedStatusEntries)
                    statusList.render();
                })
                .catch(err => {
                    throw new Error(err);
                })
        }

        //create observer
        let statusObserver = new ComponentObserver(function(event, data) {
            if(event === "changed"){
                //get new state
                const newState = data.value;
                if(newState){
                    systemActions.restartMailService()
                        .then(result => {
                            updateStatus();
                            if(self.page.snackbar){
                                self.page.snackbar.show("Mail Service gestartet.", {});
                            }
                        })
                }
                else {
                    systemActions.stopMailService()
                        .then(result => {
                            updateStatus();
                            if(self.page.snackbar){
                                self.page.snackbar.show("Mail Service gestoppt.", {});
                            }
                        })
                        .catch(err => {
                            updateStatus();
                            if(self.page.snackbar){
                                self.page.snackbar.show("Mail Service konnte nicht gestoppt werden. Error: " + err, {});
                            }
                        })
                }
            }
        });
        statusList.addObserver(statusObserver);



        /**
         * Switches
         */

            //init interactive list subcomponent
        let switchSettingsEntries = [
            {
                label: "Email-Accounts automatisch anlegen",
                value: self.data.createAccountOnUserCreation,
                identifier: "list-entry--createAccount"
            },
            {
                label: "Email-Accounts automatisch entfernen",
                value: self.data.deleteAccountOnUserDeletion,
                identifier: "list-entry--deleteAccount"

            }]

        const switchSettingsSwitch = {
            type: "switch",
            identifier: "switch-accountCreation-enabled",
            valueFunc: function(entry){
                return (entry.value);
            }
        }
        let switchSettingsData = {
            listEntries: switchSettingsEntries,
            interactions: [switchSettingsSwitch]
        }
        let switchSettingsConfig = {
            entryLabel: function(entry){
                return entry.label;
            }
        }
        let switchSettingsList = new InteractiveListStandaloneComponent({element: switchSettingsContainer, config: switchSettingsConfig, data: switchSettingsData})
        switchSettingsList.render();

        //create observer
        let switchSettingsObserver = new ComponentObserver(function(event, data) {
            if(event === "changed"){
                const updateData = {
                    createAccountOnUserCreation: self.data.createAccountOnUserCreation,
                    deleteAccountOnUserDeletion: self.data.deleteAccountOnUserDeletion,
                }
                switch(data.entry.identifier){
                    case "list-entry--deleteAccount":
                        updateData.deleteAccountOnUserDeletion = data.value;
                        break;
                    case "list-entry--createAccount":
                        updateData.createAccountOnUserCreation = data.value;
                        break;
                    default:
                        return;
                }
                systemActions.updateMailSettings(updateData)
                    .then(result => {
                        updateStatus();
                        if(self.page.snackbar){
                            self.page.snackbar.show("Mail Service gestartet.", {});
                        }
                    })
            }
        });
        switchSettingsList.addObserver(switchSettingsObserver);

        /***********************************************
                    input fields
        ***********************************************/

        const settingsInput = {
            type: "input",
            identifier: "input-service-data",
            valueFunc: function(entry){
                return (entry.value);
            },
            params: {
                disabled: false,
                readonly: true,
            }
        }
        let settingsData = {
            listEntries: createSettingEntries(),
            interactions: [settingsInput]
        }
        let settingsConfig = {
            entryLabel: function(entry){
                return entry.label;
            }
        }
        let settingsList = new InteractiveListStandaloneComponent({element: serverSettingsContainer, config: settingsConfig, data: settingsData})
        settingsList.render();

        //create observer
        let settingsObserver = new ComponentObserver((event, data) => {
            //handle onclick
            if(event === "click"){
                if(this.page.sidebar){
                    this.page.sidebar.addContent("mailSettings", {
                        title: "Mail Settings",
                        data: {url: this.data.url, port: this.data.port, baseUrl: this.data.baseUrl, apiKey: this.data.apiKey, domain: this.data.domain},
                        callback: {
                            onConfirm: (data, args) => {
                                systemActions.updateMailSettings({url: data.url, port: data.port, baseUrl: data.baseUrl, apiKey: data.apiKey, domain: data.domain})
                                    .then(result => {
                                        //restart service
                                        systemActions.restartMailService()
                                            .then(result => {
                                                this.data.url = data.url;
                                                this.data.port = data.port;
                                                this.data.baseUrl = data.baseUrl;
                                                this.data.apiKey = data.apiKey;
                                                this.data.domain = data.domain;
                                                settingsList.setListEntries(createSettingEntries())
                                                settingsList.render();
                                                this.page.sidebar.hide();
                                                if(this.page.snackbar){
                                                    this.page.snackbar.show("Mail Service neu gestartet.", {});
                                                }
                                            })
                                    })
                            }
                        }
                    })
                    this.page.sidebar.show();
                }
                else {
                    if(this.page.snackbar){
                        this.page.snackbar.showCustomError("Sidebar konnte nicht geladen werden.", "Error");
                    }
                }
            }
        })
        settingsList.addObserver(settingsObserver);

        function createSettingEntries(){
            return [
                {
                    label: "Mailserver URL",
                    value: self.data.url,
                },
                {
                    label: "Mailserver API port",
                    value: self.data.port,
                },
                {
                    label: "Mailserver API Path",
                    value: self.data.baseUrl,
                },
                {
                    label: "Mailserver API Key",
                    value: self.data.apiKey,
                },
                {
                    label: "Mailserver domain",
                    value: self.data.domain,
                }
            ]
        }

        /**
         *
         * @type {InteractionConfig}
         */
        const accountInput = {
            type: "input",
            identifier: "input-service-data",
            valueFunc: function(entry){
                return (entry.value);
            },
            params: {
                disabled: false,
                readonly: true,
            }
        }


        let accountData = {
            /**
             * @type ListEntry[]
             */
            listEntries: createAccountEntries(),
            /**
             * @type InteractionConfig[]
             */
            interactions: [accountInput]
        }
        let accountConfig = {
            entryLabel: function(entry){
                return entry.label;
            }
        }
        let accountList = new InteractiveListStandaloneComponent({element: accountContainer, config: accountConfig, data: accountData})
        accountList.render();

        //create observer
        let accountObserver = new ComponentObserver((event, data) => {
            //handle onclick
            if(event === "click"){
                if(this.page.sidebar){
                    this.page.sidebar.addContent("mailSystemAccountSettings", {
                        title: "System Mail Account Settings",
                        data: {systemMailAccount: this.data.systemMailAccount},
                        callback: {
                            onConfirm: (data, args) => {
                                systemActions.updateMailSettings({systemMailAccount: data.systemMailAccount})
                                    .then(result => {
                                        //restart service
                                        systemActions.restartMailService()
                                            .then(result => {
                                                this.data.systemMailAccount = data.systemMailAccount;
                                                accountList.setListEntries(createAccountEntries())
                                                accountList.render();
                                                this.page.sidebar.hide();
                                                if(this.page.snackbar){
                                                    this.page.snackbar.show("Mail Service neu gestartet.", {});
                                                }
                                            })
                                    })
                            }
                        }
                    })
                    this.page.sidebar.show();
                }
                else {
                    if(this.page.snackbar){
                        this.page.snackbar.showCustomError("Sidebar konnte nicht geladen werden.", "Error");
                    }
                }
            }
        })
        accountList.addObserver(accountObserver);

        /**
         *
         * @returns {ListEntry[]}
         */
        function createAccountEntries(){
            return [
                {
                    label: "System mail address",
                    value: self.data.systemMailAccount ?? "",
                },
                {
                    label: "Account token",
                    value: self.data.systemMailAccountToken ?? "",
                },
            ]
        }
        checkAccountExistsButton.addEventListener("click", ()=> {
            if(!this.data.systemMailAccount) {
                if (this.page.snackbar) {
                    this.page.snackbar.showCustomError("Cannot check account: system mail account is undefined.", "");
                }
                return;
            }
            else {
                //quick sanity check on entered address
                let domainEscaped = escapeRegExp(self.data.domain);
                const checker = new RegExp("^[a-zA-Z0-9]\\w+@" + domainEscaped +"$");
                if(!checker.test(this.data.systemMailAccount)) {
                    this.page.snackbar.showCustomError("Cannot check account: system mail account is not a valid email address.", "");
                    return;
                }
            }
            systemActions.checkMailAccountExists(this.data.systemMailAccount)
                .then(response => {
                    //account exists
                    this._enableSyncTokenButton()
                    if (this.page.snackbar) {
                        this.page.snackbar.show("Account " + this.data.systemMailAccount + " exists!", {});
                    }

                })
                .catch(err => {
                    //account does not exists
                    this._enableCreateAccountButton()
                    if (this.page.snackbar) {
                        this.page.snackbar.show("No account available for email " + this.data.systemMailAccount);

                    }

                })
        })

        this._createAccountButton.addEventListener("click", ()=> {
            if(!this._createAccountButtonEnabled){
                return;
            }
            if (!this.data.systemMailAccount) {
                if (this.page.snackbar) {
                    this.page.snackbar.showCustomError("Cannot check account: system mail account is undefined.", "");
                }
            }
            systemActions.createSystemMailAccount(this.data.systemMailAccount)
                .then(response => {
                    //account exists
                    if (this.page.snackbar) {
                        this.page.snackbar.show("Account created successfully. Email: " + response.body.email, {});
                    }
                })
                .catch(err => {
                    //account does not exists
                    if (this.page.snackbar) {
                        this.page.snackbar.error(err);
                    }

                })
        })

        this._syncTokenButton.addEventListener("click", ()=> {
            if(!this._syncTokenButtonEnabled){
                return;
            }
            if (!this.data.systemMailAccount) {
                if (this.page.snackbar) {
                    this.page.snackbar.showCustomError("Cannot check account: system mail account address is undefined.", "");
                }
            }
            systemActions.recreateSystemMailAccountToken()
                .then(response => {
                    //account exists
                    if (this.page.snackbar) {
                        this.page.snackbar.show("New token obtained successfully: " + response.body.email, {});
                    }
                })
                .catch(err => {
                    //account does not exists
                    if (this.page.snackbar) {
                        this.page.snackbar.error(err);
                    }

                })
        })
    }

    _disableCreateAccountButton(){
        this._createAccountButtonEnabled = false;
        this._createAccountButton.classList.add("content-link--disabled")
    }

    _enableCreateAccountButton(){
        this._createAccountButtonEnabled = true;
        this._createAccountButton.classList.remove("content-link--disabled")
    }

    _disableSyncTokenButton(){
        this._syncTokenButtonEnabled = false;
        this._syncTokenButton.classList.add("content-link--disabled")
    }
    _enableSyncTokenButton(){
        this._syncTokenButtonEnabled = true;
        this._syncTokenButton.classList.remove("content-link--disabled")
    }



    getHtml(){
        return this.html;
    }
}
