import Handlebars from "handlebars";
import {userActions} from "../../../actions/userActions";
import ComponentPage from "../../ComponentPage";
import Component from "../../Component";
import {EditableTextField} from "../../../helpers/editableTextField";

import "../../scss/newsComponent.scss";
import {newsActions} from "../../../actions/actions";

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
export default class NewsComponent extends Component {
    constructor({page, componentId, componentType, pageData={}, data={}, args={}}={}) {
        super({page, componentId, componentType, pageData, data, args});
        this.templateUrl = "/webpack/components/templates/dashboard/newsComponent.hbs"
        this.data.news = [];
        this.filter = {};
    }

    retrieveFiltered(filter){
        return new Promise(function(resolve, reject){
            let args = {}
            newsActions.getFiltered(filter, args)
                .then(newsArray => {
                    resolve(newsArray)
                })
                .catch(err => {
                    reject(err)
                })
        })

    }

    async preRender(){
        const news = await this.retrieveFiltered();
    }

    async postRender(){
        let self = this;
        //add sidebar hook
        this.data.news.forEach(news => {
            const container = document.querySelector(".news-card[data-id=" + news.id + "]")
            let editableTextFieldContainer = self.container.querySelector(".news-card-body--deltaContent");
            let editableTextField = new EditableTextField(editableTextFieldContainer, news.content.delta, news.content.html, undefined, {readOnly: true});
        })

    }

    getHtml(){
        return this.html;
    }
}
