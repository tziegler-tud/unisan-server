import Handlebars from "handlebars";
import {userSettingsActions} from "../../../actions/actions";
import {ComponentPage} from "../../ComponentPage";
import Component from "../../Component";


export default class UserMailSettingsComponent extends Component {
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
     * @returns {UserMailSettingsComponent}
     * @constructor
     */
    constructor({page, section, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, section, componentId,  pageData, data, args});
        if (this.data.targetUser === "current") this.data.targetUser = this.data.user;
        if(this.data.targetUser === undefined) throw new Error("Invalid Arguments received: targetUser cannot be undefined.")
        this.templateUrl = "/webpack/components/templates/settings/UserMailPassword.hbs"
    }

    async postRender(){
        let self = this;
        //add sidebar hook
        const buttonList = this.container.getElementsByClassName("changePasswordButton");
        if (buttonList.length > 0) {
            for (let button of buttonList) {
                button.addEventListener("click", function (event) {
                    if (self.page.sidebar) {
                        self.page.sidebar.addContent("UserChangePassword", {
                            sidebarTitle: "Passwort ändern: Email Account",
                            userid: self.data.targetUser.id,
                            requireCurrentPassword: false,
                            callback: {
                                onConfirm: function (userid, data) {
                                    console.log("userid: " + userid);
                                    console.log("pw: " + data.pw);
                                    console.log("check: " + data.check);

                                    userSettingsActions.updateUserMailPassword(userid, data.pw, {})
                                        .then(result => {
                                            if (self.page.snackbar) {
                                                self.page.snackbar.show("Passwort erfolgreich aktualisiert", {});
                                            }
                                            self.page.sidebar.hide();
                                        })
                                        .catch(result => {
                                            if (self.page.snackbar) {
                                                self.page.snackbar.show("Fehler: Das Mail-Passwort konnte nicht geändert werden.", {
                                                    actionButton: {
                                                        display: true,
                                                        text: "Okay."
                                                    },
                                                    closeOnEscape: true,
                                                });
                                            }

                                        })
                                }
                            }
                        })
                        self.page.sidebar.show();
                    }
                })
            }
        }


    }

    getHtml(){
        return this.html;
    }
}
