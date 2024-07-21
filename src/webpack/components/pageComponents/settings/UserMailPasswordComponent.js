import Handlebars from "handlebars";
import {userSettingsActions} from "../../../actions/actions";
import {ComponentPage} from "../../ComponentPage";
import Component from "../../Component";

/**
 *
 * @param page {ComponentPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {ComponentPage.componentTypes} type of the component
 * @param data {Object}
 * @param data.targetUser {String} target user id or "current" (default)
 * @param args {Object}
 * @returns {UserMailSettingsComponent}
 * @constructor
 */
export default class UserMailSettingsComponent extends Component {
    constructor({page, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, componentId,  pageData, data, args});
        this.data.targetUser = this.data.targetUser ?? "current";
        this.templateUrl = "/webpack/components/templates/settings/UserMailPassword.hbs"
    }

    async postRender(){
        let self = this;
        //add sidebar hook
        const buttonList = document.getElementsByClassName("changePasswordButton");
        if (buttonList.length > 0) {
            for (let button of buttonList) {
                button.addEventListener("click", function (event) {
                    if (self.page.sidebar) {
                        const isSelf = self.data.targetUser === "current";
                        let targetUserId = isSelf ? self.data.user.id : self.data.targetUser;
                        self.page.sidebar.addContent("UserChangePassword", {
                            userid: targetUserId,
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
