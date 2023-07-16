import Handlebars from "handlebars";
import {userActions} from "../actions/userActions";
import {ComponentPage} from "./ComponentPage";
import Component from "./Component";

/**
 *
 * @param page {ComponentPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {ComponentPage.componentTypes} type of the component
 * @param data {Object}
 * @param data.targetUser {String} target user id or "current" (default)
 * @param args {Object}
 * @returns {PasswordComponent}
 * @constructor
 */
export default class PasswordComponent extends Component {
    constructor({page, componentId, componentType, pageData={}, data={}, args={}}={}) {
        super({page, componentId, componentType, pageData, data, args});
        this.data.targetUser = this.data.targetUser ?? "current";
        this.templateUrl = "/webpack/components/pageModules/settings/password.hbs"
    }

    async postRender(){
        let self = this;
        //add sidebar hook
        const buttonList = document.getElementsByClassName("changePasswordButton");
        if (buttonList.length > 0) {
            for (let button of buttonList) {
                button.addEventListener("click", function (event) {
                    if (self.page.sidebar) {
                        let targetUserId = self.data.targetUser === "current" ? self.data.user.id : self.data.targetUser;
                        self.page.sidebar.addContent("UserChangePassword", {
                            userid: targetUserId,
                            callback: {
                                onConfirm: function (userid, data) {
                                    console.log("userid: " + userid);
                                    console.log("current: " + data.current);
                                    console.log("pw: " + data.pw);
                                    console.log("check: " + data.check);

                                    let action;

                                    if (self.data.targetUser === "current") {
                                        action = userActions.updateCurrentUserPassword(data.current, data.pw, {})
                                    }
                                    else {
                                        action = userActions.updateUserPassword(userid, data.current, data.pw, {});
                                    }
                                    action
                                        .done(result => {
                                            if (self.page.snackbar) {
                                                self.page.snackbar.show("Passwort erfolgreich aktualisiert", {});
                                            }
                                            self.page.sidebar.hide();
                                        })
                                        .fail(result => {
                                            if (self.page.snackbar) {
                                                self.page.snackbar.show("Fehler: Aktuelles Passwort ist nicht korrekt.", {
                                                    actionButton: {
                                                        display: true,
                                                        text: "Okay."
                                                    },
                                                    closeOnEscape: true,
                                                });
                                            }

                                        })
                                        .catch(err => {

                                        })
                                    console.log(action)
                                }
                            }
                        })
                        self.page.sidebar.show();
                    }
                })
            }
        }
        // const currentPwField = new MDCTextField(document.querySelector('#passwordCurrent'));
    }

    getHtml(){
        return this.html;
    }
}
