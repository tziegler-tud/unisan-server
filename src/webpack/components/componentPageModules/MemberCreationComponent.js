import Handlebars from "handlebars";
import {userActions} from "../../actions/userActions";
import ComponentPage from "../ComponentPage";
import Component from "../Component";
import InteractiveListStandaloneComponent from "../interactiveListStandalone";
import ComponentObserver from "../ComponentObserver";
import {systemActions} from "../../actions/systemActions";


export default class MemberCreationComponent extends Component {
    /**
     *
     * @param page {ComponentPage} parent page instance
     * @param section {ComponentSection}
     * @param componentId {String} component id number, assigend by page on creation
     * @param componentType {ComponentPage.componentTypes} type of the component
     * @param data {Object}
     * @param args {Object}
     * @returns {MemberCreationComponent}
     * @constructor
     */
    constructor({page, section, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, section, componentId,  pageData, data, args});
        this.templateUrl = "/webpack/components/templates/system/memberCreation.hbs"
    }

    async postRender(){
        let self = this;
        const memberIdModeContainer = this.container.querySelector(".memberId-mode");
        const modeDescriptionContainer = this.container.querySelector(".memberId-mode-description");
        const memberIdOffsetContainer = this.container.querySelector(".memberId-offset");

        const systemSettings = this.data.systemSettings;
        const mode = systemSettings.members.memberId.mode;
        const offset = systemSettings.members.memberId.offset;

        //init interactive list subcomponent
        const modeOptions = [
            {
                label: "Frei ab Startwert (empfohlen)",
                value: "auto-free",
                description: "Die nächste freie Nummer nach dem Startwert vergeben.",
                disabled: false,
            },
            {
                label: "Ab Startwert",
                value: "auto",
                description: "Die nächste Nummer nach dem Startwert wählen. Der Startwert wird dabei erhöht. Wenn die Nummer bereits vergeben ist, wird kein Wert gesetzt.",
                disabled: false,
            },
            {
                label: "Frei",
                value: "free",
                description: "Die niedrigste, unvergebene Nummer wählen. Startwert wird hierbei ignoriert.",
                disabled: false,
            },
            {
                label: "Deaktiviert",
                value: "off",
                description: "Beim Erstellen wird keine Mitgliedsnummer vergeben."
            }
        ]
        let modeEntries = [
            {
                label: "Mitgliedsnummer zuweisen:",
                value: modeOptions.find(option => option.value === mode).label,
            },
            {
                label: "Startenwert:",
                value: offset,
            }]

        const modeSelect = {
            type: "input",
            identifier: "label-memberid-mode",
            valueFunc: function(entry){
                return (entry.value);
            },
            options: modeOptions,
            params: {
                disabled: false,
                readonly: true,
                required: false,
            },
            config: {
                enableDescription: true,
            }
        }

        let modeData = {
            listEntries: modeEntries,
            interactions: [modeSelect]
        }
        let modeConfig = {
            entryLabel: function(entry){
                return entry.label;
            }
        }
        let modeList = new InteractiveListStandaloneComponent({element: memberIdModeContainer, config: modeConfig, data: modeData});
        modeList.render();

        let modeObserver = new ComponentObserver(function(event, data){
            //handle onclick
            if(event === "click"){
                if(self.page.sidebar){
                    self.page.sidebar.addContent("setMemberIdAssignment", {
                        title: "Einstellung: Mitglied anlegen ",
                        data: {modeOptions: modeOptions, mode: mode, offset: offset},
                        callback: {
                            onConfirm: function(data, args){

                                systemActions.setMemberIdSettings({mode: data.mode, offset: data.offset})
                                    .then(result => {
                                        window.location.reload()
                                    })
                            }
                        }
                    })
                    self.page.sidebar.show();
                }
            }
        })
        modeList.addObserver(modeObserver);

    }

    getHtml(){
        return this.html;
    }
}
