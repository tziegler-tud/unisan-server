import Handlebars from "handlebars";
import {userActions} from "../../../actions/userActions";
import ComponentPage from "../../ComponentPage";
import Component from "../../Component";
import {EditableTextField} from "../../../helpers/editableTextField";

import "../../scss/news/createNewsComponent.scss";
import {newsActions} from "../../../actions/newsActions";
import EditableInputField from "../../../helpers/editableInputField";
import {Dialog as LidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";



export default class EditNewsComponent extends Component {
    /**
     *
     * @param page {ComponentPage} parent page instance
     * @param section {ComponentSection}
     * @param componentId {String} component id number, assigend by page on creation
     * @param componentType {ComponentPage.componentTypes} type of the component
     * @param data {Object}
     * @param args {Object}
     * @returns {NewsComponent}
     * @constructor
     */
    constructor({page, section, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, section, componentId,  pageData, data, args});
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
        this.titleField = new EditableInputField(titleFieldContainer, this.data.news.title.delta, this.data.news.title.value, "text", callback, {readOnly: false, active: true, disableButtons: true});
        let contentFieldContainer = self.container.querySelector(".news-content--input");
        this.contentField = new EditableTextField(contentFieldContainer, this.data.news.content.delta, this.data.news.content.value, callback, {readOnly: false, active: true, disableButtons: true});

        const saveButtons = document.querySelectorAll(".news-saveButton");
        saveButtons.forEach(btn => {
            btn.addEventListener("click", function(){
                self.save();
            })
        })

        const deleteButtons = document.querySelectorAll(".news-deleteButton");
        deleteButtons.forEach(btn => {
            btn.addEventListener("click", function(){
                self.delete();
            })
        })
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
        newsActions.save(this.data.news.id, data, {})
            .then(result => {
                window.location = "/dashboard/news";
            })
            .fail((jqxhr, textstatus, error) => {
                window.snackbar.showError(jqxhr, textstatus, error)
            });
    }

    delete(){
        const newsId = this.data.news.id;
        const deleteContent = {
            title: "Newsbeitrag löschen",
            message: "Dieser Vorgang kann nicht rückgängig gemacht werden. Fortfahren?",
            titleArg: "",
            messageArg: ""
        };

        var deleteArgs = {
            id: newsId,
            callback: {
                onConfirm: function () {
                    newsActions.delete(newsId, {},{
                        onSuccess: function(result){
                            window.location = "/dashboard/news";
                        }
                    })
                        .fail((jqxhr, textstatus, error) => window.snackbar.showError(jqxhr, textstatus, error));
                }
            }
        };

        var token = lidlRTO.objectManager.createNewObjectToken();
        const dialogDeleteEvent = new LidlDialog(token, ".eventDelete", 'confirmDelete', deleteContent, deleteArgs);
        lidlRTO.objectManager.addObject(dialogDeleteEvent, token);
        dialogDeleteEvent.openDialog();

    }

    getHtml(){
        return this.html;
    }
}
