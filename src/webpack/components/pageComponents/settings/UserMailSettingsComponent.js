import Handlebars from "handlebars";
import {userSettingsActions} from "../../../actions/actions";
import {ComponentPage} from "../../ComponentPage";
import Component from "../../Component";
import InteractiveListStandaloneComponent from "../../interactiveListStandalone";


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

        const emailViewerContainer = document.getElementById("usermail-emailViewer");

        const emailViewerLabel = {
            type: "label",
            identifier: "usermail-emailViewer-label",
            valueFunc: function(entry){
                return (entry.value);
            },
            config: {
                classes: ["usermail-emailViewer--label"],
            }
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
                listEntries: [{label: "interne Emailadresse:", value: this.data.targetUser.internalEmail ?? "nicht verfügbar"}],
                interactions: [emailViewerLabel]
            }});

        await emailViewerList.render();
    }

    getHtml(){
        return this.html;
    }
}
