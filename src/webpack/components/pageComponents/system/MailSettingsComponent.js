import {ComponentPage} from "../../ComponentPage";
import ComponentObserver from "../../ComponentObserver.js";
import Component from "../../Component";
import InteractiveListStandaloneComponent from "../../interactiveListStandalone";
import {systemActions} from "../../../actions/actions";
import {ScrollableList} from "../../../scrollableList/scrollableList";
import {Dialog as lidlDialog} from "../../../../lib/lidl-modules/dialog/lidl-dialog";
import Sidebar from "../../../sidebar/Sidebar"
import {systemPlugin} from "../../../sidebar/plugins/plugin-system"

export default class MailSettingsComponent extends Component {
    /**
     *
     * @param page {ComponentPage} parent page instance
     * @param componentId {String} component id number, assigend by page on creation
     * @param componentType {ComponentPage.componentTypes} type of the component
     * @param data {Object}
     * @param args {Object}
     * @returns {OpenIdSettingsComponent}
     * @constructor
     */
    constructor({page, componentId,  pageData={}, data, args}={}) {
        super({page, componentId,  pageData, data, args});
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
        let switchSettingsEntries = [{
                label: "Account automatisch anlegen",
                value: self.data.createAccountOnUserCreation,
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
                    createAccountOnUserCreation: data.value
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

        // const advancedInput = {
        //     type: "input",
        //     identifier: "input-advanced-data",
        //     valueFunc: function(entry){
        //         return (entry.value);
        //     },
        //     params: {
        //         disabled: false,
        //         readonly: true,
        //     }
        // }
        //
        // let advancedData = {
        //     listEntries: [ {
        //         label: "Cookie secrets",
        //         value: self.data.cookieSecrets,
        //         },
        //     ],
        //     interactions: [advancedInput]
        // }
        // let advancedConfig = {
        //     entryLabel: function(entry){
        //         return entry.label;
        //     }
        // }
        // let advancedList = new InteractiveListStandaloneComponent({element: advancedContainer, config: advancedConfig, data: advancedData})
        // advancedList.render();
        // //create observer
        // let advancedObserver = new ComponentObserver(function(event, data){
        //     //handle onclick
        //     if(event === "click"){
        //         if(self.page.sidebar){
        //             self.page.sidebar.addContent("openIdSettingsAdvanced", {
        //                 title: "OpenID Settings (Advanced)",
        //                 data: {cookieSecrets: self.data.cookieSecrets},
        //                 callback: {
        //                     onConfirm: function(data, args){
        //                         systemActions.updateOidcSettingsAdvanced({cookieSecrets: data.cookieSecrets})
        //                             .then(result => {
        //                                 //restart service
        //                                 systemActions.restartOidcService()
        //                                     .then(result => {
        //                                         self.data.cookieSecrets = data.cookieSecrets;
        //                                         advancedList.setListEntries([ {
        //                                             label: "Cookie secrets",
        //                                             value: self.data.cookieSecrets,
        //                                         }])
        //                                         advancedList.render();
        //                                         self.page.sidebar.hide();
        //                                         if(self.page.snackbar){
        //                                             self.page.snackbar.show("OpenID Service neu gestartet.", {});
        //                                         }
        //                                     })
        //                             })
        //                     }
        //                 }
        //             })
        //             self.page.sidebar.show();
        //         }
        //     }
        // })
        // advancedList.addObserver(advancedObserver);
    }

    getHtml(){
        return this.html;
    }
}
