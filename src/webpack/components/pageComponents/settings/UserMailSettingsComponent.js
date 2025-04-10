import Handlebars from "handlebars";
import {userActions} from "../../../actions/userActions";
import ComponentPage from "../../ComponentPage";
import Component from "../../Component";
import InteractiveListStandaloneComponent from "../../interactiveListStandalone";
import ComponentObserver from "../../ComponentObserver";


export default class UserMailSettingsComponent extends Component {
    /**
     *
     * @param page {ComponentPage} parent page instance
     * @param componentId {String} component id number, assigend by page on creation
     * @param componentType {ComponentPage.componentTypes} type of the component
     * @param data {Object}
     * @param data.user {Object} current user object
     * @param data.targetUser {String | Object} target user object or "current" (default)
     * @param args {Object}
     * @returns {UserMailSettingsComponent}
     * @constructor
     */
    constructor({page, section, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, section, componentId,  pageData, data, args});
        if (this.data.targetUser === "current") this.data.targetUser = this.data.user;
        if(this.data.targetUser === undefined) throw new Error("Invalid Arguments received: targetUser cannot be undefined.")
        this.templateUrl = "/webpack/components/templates/settings/UserMailSettings.hbs"
    }

    async postRender(){

        const current = this.data.targetUser.internalEmail;
        const username = this.data.targetUser.username;
        const userid = this.data.targetUser.id;

        const emailViewerContainer = document.getElementById("usermail-emailViewer");

        function createEntries(){
            return [
                {
                    label: "interne Emailadresse:",
                    value: current ?? "nicht verfügbar"}
            ]
        }

        const emailViewerInput = {
            type: "input",
            identifier: "usermail-emailViewer-input",
            valueFunc: function(entry){
                return (entry.value);
            },
            config: {
                classes: ["usermail-emailViewer--input"],
            },
            params: {
                disabled: false,
                readonly: true,
                required: false,
            },
        }

        let emailViewerList = new InteractiveListStandaloneComponent({
            element: emailViewerContainer,
            config: {
                entryLabel: function(entry){
                    return entry.label;
                },
                defaultIcon: "",
                interactive: false,
                },
            data: {
                listEntries: createEntries(),
                interactions: [emailViewerInput]
            }});

        await emailViewerList.render();
        let settingsObserver = new ComponentObserver((event, data)=>{
            //handle onclick
            if(event === "click"){
                if(!this.args.allowEditCritical) return;
                if(this.page.sidebar){
                    this.page.sidebar.addContent("UserSetInternalEmail", {
                        title: "Interne Mail: " + username,
                        data: {current: current, username: username},
                        callback: {
                            onConfirm: function(data){
                                userActions.updateInternalMail({
                                    mail: data,
                                    userId: userid,
                                })
                                .then(result => {
                                    window.location.reload();
                                })
                            }
                        }
                    })
                    this.page.sidebar.show();
                }
            }
        })
        emailViewerList.addObserver(settingsObserver);
    }

    getHtml(){
        return this.html;
    }
}
