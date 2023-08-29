import Handlebars from "handlebars";
import {userActions} from "../../actions/userActions";
import ComponentPage from "../ComponentPage";
import Component from "../Component";

/**
 *
 * @param page {ComponentPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {ComponentPage.componentTypes} type of the component
 * @param data {Object}
 * @param args {Object}
 * @returns {MemberCreationComponent}
 * @constructor
 */
export default class MemberCreationComponent extends Component {
    constructor({page, componentId, componentType, pageData, data, args}={}) {
        super({page, componentId, componentType, pageData, data, args});
        this.templateUrl = "/webpack/components/pageModules/system/memberCreation.hbs"
    }

    async postRender(){
        let self = this;
        const memberIdModeContainer = this.container.querySelector(".memberId-mode");
        const memberIdOffsetContainer = this.container.querySelector(".memberId-offset");

    }

    getHtml(){
        return this.html;
    }
}
