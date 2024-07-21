import Handlebars from "handlebars";
import {userSettingsActions} from "../../../actions/actions";
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
 * @returns {UserMailSettingsComponent}
 * @constructor
 */
export default class UserMailSettingsComponent extends Component {
    constructor({page, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, componentId,  pageData, data, args});
        this.data.targetUser = this.data.targetUser ?? "current";
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
                listEntries: [{label: "interne Emailadresse", value: this.data.user.internalEmail}],
                interactions: [emailViewerLabel]
            }});

        await emailViewerList.render();
    }

    getHtml(){
        return this.html;
    }
}
