import Handlebars from "handlebars";
import {userActions} from "../actions/userActions";
import {ComponentPage} from "./ComponentPage";
import Component from "./Component";
import {systemActions} from "../actions/actions";
import "./scss/connectedServices.scss";
import {Dialog as lidlDialog} from "../../lib/lidl-modules/dialog/lidl-dialog";

/**
 *
 * @param page {ComponentPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {ComponentPage.componentTypes} type of the component
 * @param data {Object}
 * @param args {Object}
 * @returns {ConnectedServicesComponent}
 * @constructor
 */
export default class ConnectedServicesComponent extends Component {
    constructor({page, componentId, componentType, pageData, data, args}={}) {
        super({page, componentId, componentType, pageData, data, args});
        this.templateUrl = "/webpack/components/pageModules/settings/connectedServices.hbs";
    }

    async preRender(){
        let self = this;

        const sessionsContainer = this.container.querySelector(".openid-sessions");
        //get user sessions
        const sessions = await systemActions.getUserSessions();
        this.data.sessions = sessions;


    }

    async postRender(){
        let self = this;
        const deleteButtons = this.container.querySelectorAll(".openid-sessionCard--deleteButton");

        deleteButtons.forEach(button => {
            button.addEventListener("click", function(e){
                const dialog_content = {
                    title: "OpenID Session beenden",
                    message: "Folgender OpenID Session wird beendet: " + button.dataset.sessionid,
                    titleArg: "",
                    messageArg: ""
                };
                var dialog_token = lidlRTO.objectManager.createNewObjectToken();
                const dialog_args = {

                };
                const cb = {
                    onConfirm: function(res){
                        systemActions.removeUserSession(button.dataset.sessionid)
                            .then(result => {
                                window.location.reload();
                            })
                        lidlRTO.objectManager.removeObject(dialog_token);
                    }
                }
                const dialog = new lidlDialog(dialog_token, null, 'confirmDelete', dialog_content, dialog_args, cb);
                lidlRTO.objectManager.addObject(dialog, dialog_token);
                dialog.openDialog();
            })
        })
    }

    getHtml(){
        return this.html;
    }
}
