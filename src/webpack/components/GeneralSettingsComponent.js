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
 * @param args {Object}
 * @returns {GeneralSettingsComponent}
 * @constructor
 */
export default class GeneralSettingsComponent extends Component {
    constructor({page, componentId,  pageData, data, args}={}) {
        super({page, componentId,  pageData, data, args});
        this.templateUrl = "/webpack/components/templates/settings/generalSettings.hbs"
    }

    async postRender(){
        let self = this;
    }

    getHtml(){
        return this.html;
    }
}
