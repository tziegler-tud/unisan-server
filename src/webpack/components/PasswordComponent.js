import Handlebars from "handlebars";
import {userActions} from "../actions/userActions";
import ComponentPage from "./ComponentPage";
import Component from "./Component";


export default class PasswordComponent extends Component {
    /**
     *
     * @param page {ComponentPage} parent page instance
     * @param section {ComponentSection}
     * @param componentId {String} component id number, assigend by page on creation
     * @param componentType {ComponentPage.componentTypes} type of the component
     * @param data {Object}
     * @param data.targetUser {Object} target user id or "current" (default)
     * @param data.user {Object} authenticating user id
     * @param data.requirePassword {boolean=true} false to disable the input field for "current password"
     * @param args {Object}
     * @returns {PasswordComponent}
     * @constructor
     */
    constructor({page, section, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, section, componentId,  pageData, data, args});
        this.isSelf = false;
        this.requirePassword = data.requirePassword ?? true;
        if (this.data.targetUser === "current" || this.data.targetUser.id.toString() === this.data.user.id.toString()) {
            this.data.targetUser = this.data.user;
            this.isSelf = true;
        }
        if(this.data.targetUser === undefined) throw new Error("Invalid Arguments received: targetUser cannot be undefined.")
        this.templateUrl = "/webpack/components/templates/settings/password.hbs"
    }

    async postRender(){
        let self = this;
        //add sidebar hook
        const buttonList = this.container.getElementsByClassName("changePasswordButton");
        if (buttonList.length > 0) {
            for (let button of buttonList) {
                button.addEventListener("click", (event) => {
                    if (self.page.sidebar) {
                        self.page.sidebar.addContent("UserChangePassword", {
                            sidebarTitle: "unisan-server Passwort ändern",
                            userid: this.data.targetUser.id,
                            requireCurrentPassword: this.requirePassword,
                            callback: {
                                onConfirm: (userid, data) => {
                                    console.log("userid: " + userid);
                                    console.log("current: " + data.current);
                                    console.log("pw: " + data.pw);
                                    console.log("check: " + data.check);

                                    let action;

                                    if (this.isSelf) {
                                        action = userActions.updateCurrentUserPassword(data.current, data.pw, {})
                                    }
                                    else {
                                        action = userActions.updateUserPassword(userid, data.pw, {});
                                    }
                                    action
                                        .done(result => {
                                            if (self.page.snackbar) {
                                                self.page.snackbar.show("Passwort erfolgreich aktualisiert", {});
                                            }
                                            self.page.sidebar.hide();
                                        })
                                        .catch((jqxhr, textStatus, errThrown) => {
                                            if (self.page.snackbar) {

                                                if(jqxhr.status === 400) {
                                                    self.page.snackbar.show("Fehler: Aktuelles Passwort ist nicht korrekt.", {
                                                        actionButton: {
                                                            display: true,
                                                            text: "Okay."
                                                        },
                                                        closeOnEscape: true,
                                                    });
                                                }
                                                else {
                                                    self.page.snackbar.showError(jqxhr, textStatus, errThrown, {
                                                        actionButton: {
                                                            display: true,
                                                            text: "Okay."
                                                        },
                                                        closeOnEscape: true,
                                                    });
                                                }

                                            }
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
