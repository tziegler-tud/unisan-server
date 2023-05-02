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
 * @returns {ConnectedServicesComponent}
 * @constructor
 */
export default class ConnectedServicesComponent extends Component {
    constructor({page, componentId, componentType, data, args}={}) {
        super({page, componentId, componentType, data, args});
        this.templateUrl = "/webpack/components/pageModules/settings/connectedServices.hbs"
    }

    async postRender(){
        let self = this;
    }

    getHtml(){
        return this.html;
    }
}
