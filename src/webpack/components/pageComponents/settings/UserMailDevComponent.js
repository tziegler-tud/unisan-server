import {systemActions} from "../../../actions/systemActions";
import ComponentPage from "../../ComponentPage";
import Component from "../../Component";
import InteractiveListStandaloneComponent from "../../interactiveListStandalone";


export default class UserMailDevComponent extends Component {
    /**
     *
     * @param page {ComponentPage} parent page instance
     * @param section {ComponentSection}
     * @param componentId {String} component id number, assigend by page on creation
     * @param componentType {ComponentPage.componentTypes} type of the component
     * @param data {Object}
     * @param data.user {Object} current user object
     * @param data.targetUser {String} target user object or "current" (default)
     * @param args {Object}
     * @returns {UserMailDevComponent}
     * @constructor
     */
    constructor({page, section, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, section, componentId,  pageData, data, args});
        if (this.data.targetUser === "current") this.data.targetUser = this.data.user;
        if(this.data.targetUser === undefined) throw new Error("Invalid Arguments received: targetUser cannot be undefined.")
        this.templateUrl = "/webpack/components/templates/settings/UserMailDev.hbs"
        this._createAccountButtonEnabled = false;
        this._syncTokenButtonEnabled = false;
    }

    async postRender(){
        const emailViewerContainer = document.getElementById("usermaildev-apitoken");
        const checkAccountExistsButton = document.getElementById("checkAccountExistsButton");
        this._createAccountButton = document.getElementById("createAccountButton");
        this._syncTokenButton = document.getElementById("syncTokenButton");

        this._disableCreateAccountButton();
        this._disableSyncTokenButton();

        const tokenLabels = {
            type: "label",
            identifier: "usermaildev-token-label",
            valueFunc: function(entry){
                return (entry.value);
            },
            config: {
                classes: ["usermaildev-token--label"],
            }
        }

        let tokenViewerList = new InteractiveListStandaloneComponent({
            element: emailViewerContainer,
            config: {
                entryLabel: function(entry){
                    return entry.label;
                },
                defaultIcon: "",
                interactive: false,
            },
            data: {
                listEntries: [
                    {label: "application token", value: this.data.targetUser.mail.applicationToken, disabled: !this.data.targetUser.mail.applicationToken},
                    {label: "sender name", value: this.data.targetUser.mail.senderName, disabled: !this.data.targetUser.mail.senderName}
                ],
                interactions: [tokenLabels]
            }});

        await tokenViewerList.render();

        checkAccountExistsButton.addEventListener("click", ()=> {
            if(!this.data.targetUser.internalEmail) {
                if (this.page.snackbar) {
                    this.page.snackbar.showCustomError("Cannot check account: internalEmail is undefined.", "");
                }
            }
            systemActions.checkMailAccountExists(this.data.targetUser.internalEmail)
                .then(response => {
                    //account exists
                    this._enableSyncTokenButton()
                    if (this.page.snackbar) {
                        this.page.snackbar.show("Account " + this.data.targetUser.internalEmail + " exists!", {});
                    }

                })
                .catch(err => {
                    //account does not exists
                    this._enableCreateAccountButton()
                    if (this.page.snackbar) {
                        this.page.snackbar.show("No account available for email " + this.data.targetUser.internalEmail);

                    }

                })
        })

        this._createAccountButton.addEventListener("click", ()=> {
            if(!this._createAccountButtonEnabled){
                return;
            }
            if (!this.data.targetUser.internalEmail) {
                if (this.page.snackbar) {
                    this.page.snackbar.showCustomError("Cannot check account: internalEmail is undefined.", "");
                }
            }
            systemActions.createUserMailAccount(this.data.targetUser.id)
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
            if (!this.data.targetUser.internalEmail) {
                if (this.page.snackbar) {
                    this.page.snackbar.showCustomError("Cannot check account: internalEmail is undefined.", "");
                }
            }
            systemActions.syncUserMailToken(this.data.targetUser.id)
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
