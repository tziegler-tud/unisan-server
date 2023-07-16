import Handlebars from "handlebars";
import {userActions} from "../actions/userActions";
import {ComponentPage} from "./ComponentPage";
import ComponentObserver from "./ComponentObserver.js";
import Component from "./Component";
import InteractiveListStandaloneComponent from "./interactiveListStandalone";
import {qualificationActions, systemActions} from "../actions/actions";
import {ScrollableList} from "../scrollableList/scrollableList";
import {escapeSelector} from "../helpers/helpers";
import {Dialog as lidlDialog} from "../../lib/lidl-modules/dialog/lidl-dialog";

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
export default class OpenIdSettingsComponent extends Component {
    constructor({page, componentId, componentType, pageData={}, data, args}={}) {
        super({page, componentId, componentType, pageData, data, args});
        this.templateUrl = "/webpack/components/pageModules/system/openIdSettings.hbs"
    }

    async postRender(){
        let self = this;
        //get settings container
        const monitorContainer = this.container.querySelector(".openid-monitor");
        const statusContainer = this.container.querySelector(".openid-status");
        const settingsContainer = this.container.querySelector(".openid-settings");
        const advancedContainer = this.container.querySelector(".openid-advanced");
        const clientsContainer = this.container.querySelector(".openid-clients");
        const addClientButton = this.container.querySelector(".openid-addClient");

        //get service status
        let statusRequest = await systemActions.getOidcStatus();
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
            label: "OpenID Login aktivieren",
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
            systemActions.getOidcStatus()
                .then(statusRequest=> {
                    const status = statusRequest.status;
                    const monitorEntries = [{label: "Service Status:", value: status}]
                    monitorList.setListEntries(monitorEntries)
                    monitorList.render();

                    const statusEntries = [{
                        label: "OpenID Login aktivieren",
                        value: (status === "running"),
                    }]
                    statusList.setListEntries(statusEntries)
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
                    systemActions.restartOidcService()
                        .then(result => {
                            updateStatus();
                            if(self.page.snackbar){
                                self.page.snackbar.show("OpenID Service gestartet.", {});
                            }
                        })
                }
                else {
                    systemActions.stopOidcService()
                        .then(result => {
                            updateStatus();
                            if(self.page.snackbar){
                                self.page.snackbar.show("OpenID Service gestoppt.", {});
                            }
                        })
                        .catch(err => {
                            updateStatus();
                            if(self.page.snackbar){
                                self.page.snackbar.show("OidcService konnte nicht gestoppt werden. Error: " + err, {});
                            }
                        })
                }
            }
        });
        statusList.addObserver(statusObserver);


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
        let settingsList = new InteractiveListStandaloneComponent({element: settingsContainer, config: settingsConfig, data: settingsData})
        settingsList.render();

        //create observer
        let settingsObserver = new ComponentObserver(function(event, data){
            //handle onclick
            if(event === "click"){
                if(self.page.sidebar){
                    self.page.sidebar.addContent("openIdSettings", {
                        title: "OpenID Settings",
                        data: {issuer: self.data.issuer, port: self.data.port},
                        callback: {
                            onConfirm: function(data, args){

                                systemActions.updateOidcSettings({issuer: data.issuer, port: data.port})
                                    .then(result => {
                                        //restart service
                                        systemActions.restartOidcService()
                                            .then(result => {
                                                self.data.issuer = data.issuer;
                                                self.data.port = data.port;
                                                settingsList.setListEntries(createSettingEntries())
                                                settingsList.render();
                                                self.page.sidebar.hide();
                                                if(self.page.snackbar){
                                                    self.page.snackbar.show("OpenID Service neu gestartet.", {});
                                                }
                                            })
                                    })
                            }
                        }
                    })
                    self.page.sidebar.show();
                }
            }
        })
        settingsList.addObserver(settingsObserver);

        function createSettingEntries(){
            return [
                {
                    label: "Issuer url",
                    value: self.data.issuer,
                },
                {
                    label: "Issuer port",
                    value: self.data.port,
                }
            ]
        }

        const advancedInput = {
            type: "input",
            identifier: "input-advanced-data",
            valueFunc: function(entry){
                return (entry.value);
            },
            params: {
                disabled: false,
                readonly: true,
            }
        }

        let advancedData = {
            listEntries: [ {
                label: "Cookie secrets",
                value: self.data.cookieSecrets,
                },
            ],
            interactions: [advancedInput]
        }
        let advancedConfig = {
            entryLabel: function(entry){
                return entry.label;
            }
        }
        let advancedList = new InteractiveListStandaloneComponent({element: advancedContainer, config: advancedConfig, data: advancedData})
        advancedList.render();
        //create observer
        let advancedObserver = new ComponentObserver(function(event, data){
            //handle onclick
            if(event === "click"){
                if(self.page.sidebar){
                    self.page.sidebar.addContent("openIdSettingsAdvanced", {
                        title: "OpenID Settings (Advanced)",
                        data: {cookieSecrets: self.data.cookieSecrets},
                        callback: {
                            onConfirm: function(data, args){
                                systemActions.updateOidcSettingsAdvanced({cookieSecrets: data.cookieSecrets})
                                    .then(result => {
                                        //restart service
                                        systemActions.restartOidcService()
                                            .then(result => {
                                                self.data.cookieSecrets = data.cookieSecrets;
                                                advancedList.setListEntries([ {
                                                    label: "Cookie secrets",
                                                    value: self.data.cookieSecrets,
                                                }])
                                                advancedList.render();
                                                self.page.sidebar.hide();
                                                if(self.page.snackbar){
                                                    self.page.snackbar.show("OpenID Service neu gestartet.", {});
                                                }
                                            })
                                    })
                            }
                        }
                    })
                    self.page.sidebar.show();
                }
            }
        })
        advancedList.addObserver(advancedObserver);

        let listData = [];
        self.data.clients.forEach(client => {
            listData.push({
                id: client._id,
                key: client._id,
                value: client.name,
                name: client.name,
                clientId: client.client_id,
                enabled: client.enabled,
                columns: [{property: "name", data: client.name},{property: "clientId", data: client.client_id}, {property: "enabled", data: client.enabled ? "active" : "inactive"}]
            })
        })
        let scrollArgs = {
            view: "list",
            height: "fixed",
            fixedHeight: "20em",
            hasTitle: true,
            title: "Clients",
            listcolumns: [
                {property: "name", name: "Name"},
                {property: "clientId", name: "client_id"},
                {property: "enabled", name: "Status"},
            ]
        }
        let callback = {
            listItem: {
                onClick: function (e) {
                    let item = e.currentTarget;
                    e.preventDefault();
                    let sidebar = self.page.sidebar;
                    const client = self.data.clients.find(client => client._id === item.dataset.dataid);
                    //get client secret
                    systemActions.getOidcClientSecret(client._id)
                        .then(secret => {
                            client.client_secret = secret;
                            sidebar.addContent("updateOidcClient", {
                                //find client
                                title: "OpenID Client: " + client.name,
                                data: {client: client},
                                callback: {
                                    onConfirm: function(id, data){
                                        systemActions.updateOidcClient(client._id, data)
                                            .then(result => {
                                                window.location.reload();
                                            })
                                    },
                                    onDelete: function(id, data){
                                        const dialog_content = {
                                            title: "OpenID entfernen",
                                            message: "Folgender OpenID Client wird gelöscht: " + data.name,
                                            titleArg: "",
                                            messageArg: ""
                                        };
                                        var dialog_token = lidlRTO.objectManager.createNewObjectToken();
                                        const dialog_args = {

                                        };
                                        const cb = {
                                            onConfirm: function(res){
                                                systemActions.removeOidcClient(client._id)
                                                    .then(result => {
                                                        window.location.reload();
                                                    })
                                                lidlRTO.objectManager.removeObject(dialog_token);
                                            }
                                        }
                                        const dialog = new lidlDialog(dialog_token, null, 'confirmDelete', dialog_content, dialog_args, cb);
                                        lidlRTO.objectManager.addObject(dialog, dialog_token);
                                        dialog.openDialog();
                                    }
                                }
                            });
                            sidebar.show();
                        })
                }
            }
        }
        let scrollableList = new ScrollableList(clientsContainer, "generic", listData, scrollArgs, callback)

        //setup addClient Button
        addClientButton.addEventListener("click", function() {
            self.page.sidebar.addContent("addOidcClient", {
                title: "Add OpenID Client",
                data: {client: {enabled: true}},
                callback: {
                    onConfirm: function (data) {
                        systemActions.addOidcClient(data)
                            .then(result => {
                                window.location.reload();
                            })
                    },
                }
            });
            self.page.sidebar.show();
        })
    }

    getHtml(){
        return this.html;
    }
}
