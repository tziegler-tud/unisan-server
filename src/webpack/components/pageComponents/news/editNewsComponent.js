import Handlebars from "handlebars";
import {userActions} from "../../../actions/userActions";
import ComponentPage from "../../ComponentPage";
import Component from "../../Component";
import {EditableTextField} from "../../../helpers/editableTextField";

import "../../scss/news/createNewsComponent.scss";
import {newsActions} from "../../../actions/actions";
import {EditableInputField} from "../../../helpers/editableInputField";

/**
 *
 * @param page {ComponentPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {ComponentPage.componentTypes} type of the component
 * @param data {Object}
 * @param args {Object}
 * @returns {NewsComponent}
 * @constructor
 */
export default class EditNewsComponent extends Component {
    constructor({page, componentId, componentType, pageData={}, data={}, args={}}={}) {
        super({page, componentId, componentType, pageData, data, args});
        this.templateUrl = "/webpack/components/templates/news/editNews.hbs"

        const defaultData = {
            news: {
                content: {},
                title: {},
            },
        }

        this.data = Object.assign(defaultData, this.data)
    }

    async postRender(){
        let self = this;
        //add sidebar hook
        const callback = {
            onConfirm: function(editableTextField){

            }
        };
        let titleFieldContainer = self.container.querySelector(".news-title--input");
        this.titleField = new EditableInputField(titleFieldContainer, this.data.news.content.delta, this.data.news.content.html, "text", callback, {readOnly: false, active: true, disableButtons: true});
        let contentFieldContainer = self.container.querySelector(".news-content--input");
        this.contentField = new EditableTextField(contentFieldContainer, this.data.news.content.delta, this.data.news.content.html, callback, {readOnly: false, active: true, disableButtons: true});
    }

    save(){
        let data = {
            title: {
                value: this.titleField.getQuill().getText(),
                delta: this.titleField.getQuill().getContents(),
            },
            content:{
                value: this.contentField.getQuill().getText(),
                delta: this.contentField.getQuill().getContents(),
            },
            author: this.data.user.id,
        }
        newsActions.create(data, {
            onSuccess: function(result){
                window.location = "/dashboard/news";
            }
        })
    }

    getHtml(){
        return this.html;
    }
}
