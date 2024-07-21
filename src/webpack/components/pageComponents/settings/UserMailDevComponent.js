import Handlebars from "handlebars";
import {systemActions, userSettingsActions} from "../../../actions/actions";
import {ComponentPage} from "../../ComponentPage";
import Component from "../../Component";
import InteractiveListStandaloneComponent from "../../interactiveListStandalone";

/**
 *
 * @param page {ComponentPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {ComponentPage.componentTypes} type of the component
 * @param data {Object}
 * @param data.targetUser {String} target user id or "current" (default)
 * @param args {Object}
 * @returns {UserMailDevComponent}
 * @constructor
 */
export default class UserMailDevComponent extends Component {
    constructor({page, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, componentId,  pageData, data, args});
        this.data.targetUser = this.data.targetUser ?? "current";
        this.templateUrl = "/webpack/components/templates/settings/UserMailDev.hbs"
    }

    async postRender(){
        const emailViewerContainer = document.getElementById("usermaildev-apitoken");
        const checkAccountExistsButton = document.getElementById("checkAccountExistsButton");
        const createAccountButton = document.getElementById("createAccountButton");

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
                    {label: "application token", value: this.data.user.mail.applicationToken, disabled: !this.data.user.mail.applicationToken},
                    {label: "sender name", value: this.data.user.mail.senderName, disabled: !this.data.user.mail.senderName}
                ],
                interactions: [tokenLabels]
            }});

        await tokenViewerList.render();

        checkAccountExistsButton.addEventListener("click", ()=> {
            if(!this.data.user.internalEmail) {
                if (this.page.snackbar) {
                    this.page.snackbar.showCustomError("Cannot check account: internalEmail is undefined.", "");
                }
            }
            systemActions.checkMailAccountExists(this.data.user.internalEmail)
                .then(response => {
                    //account exists
                    if (this.page.snackbar) {
                        this.page.snackbar.show("Account " + this.data.user.internalEmail + " exists!", {});
                    }

                })
                .catch(err => {
                    //account does not exists
                    if (this.page.snackbar) {
                        this.page.snackbar.show("No account available for email " + this.data.user.internalEmail);
                    }

                })
        })

        createAccountButton.addEventListener("click", ()=> {
            if (!this.data.user.internalEmail) {
                if (this.page.snackbar) {
                    this.page.snackbar.showCustomError("Cannot check account: internalEmail is undefined.", "");
                }
            }
            systemActions.createUserMailAccount(this.data.user.id)
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


    }

    getHtml(){
        return this.html;
    }
}
