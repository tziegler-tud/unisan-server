import Handlebars from "handlebars";
import ComponentPage from "../../ComponentPage";
import Component from "../../Component";
import {EditableTextField} from "../../../helpers/editableTextField";

var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");
const {ScrollableList} = require("../../../scrollableList/scrollableList");
const {Sidebar} = require("../../../sidebar/sidebar");
import {Searchbar} from "../../../searchbar/searchbar";
import {Corner, DropdownMenu} from "../../../helpers/dropdownMenu";
import {Dialog as LidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";

import "../../scss/newsComponent.scss";
import {eventActions, newsActions} from "../../../actions/actions";
import {dateFromNow, transformDateTimeString} from "../../../helpers/helpers";

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
            let args = {
            }
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
        //smart grouping
        //get current date
        const date = new Date();
        const today = new Date();
        today.setHours(0,0,0,0);
        const yesterday = dateFromNow({days: -1}, today);
        const lastWeek =  dateFromNow({weeks:-1}, today);

        const groups = [
            {
                label: "Heute",
                minDate: today,
                maxDate: date,
            },
            {
                label: "Gestern",
                minDate: yesterday,
                maxDate: today,
            },
            {
                label: "letzte Woche",
                minDate: lastWeek,
                maxDate: yesterday,
            },
        ];

        news.forEach(function(newsEntry){
            sortIntoGroup(newsEntry);
        })
        this.data.groups = groups;
        this.data.news = news;

        function sortIntoGroup(newsEntry){
            const entryDate = new Date(newsEntry.created);
            let matchingGroup = undefined;
            matchingGroup = groups.find(group => {
                return (group.minDate <= entryDate && group.maxDate > entryDate);
            })
            if(matchingGroup){
                if(matchingGroup.entries === undefined) {
                    matchingGroup.entries = []
                }
                matchingGroup.entries.push(newsEntry);
            }
            else {
                if(newsEntry.created >= Date.now()){
                    //entry is dated in the future. Create a group containing only the date
                    const newGroup = {label: transformDateTimeString(entryDate).date, entries: [newsEntry]}
                    groups.push(newGroup)
                }
                else {
                    //create month group and add entry
                    const monthYear = transformDateTimeString(entryDate).monthYear;
                    const minDate = new Date(entryDate);
                    minDate.setDate(1);
                    minDate.setHours(0,0,0,0);
                    const maxDate = new Date(entryDate);
                    maxDate.setMonth(maxDate.getMonth()+1);
                    maxDate.setDate(0);
                    maxDate.setHours(23,59,59,999);
                    const newGroup = {label: monthYear, minDate: minDate, maxDate: maxDate, entries: [newsEntry]}
                    groups.push(newGroup);
                }
            }
        }
    }

    async postRender(){
        let self = this;
        //add sidebar hook
        // this.data.news.forEach(news => {
        //     const container = document.querySelector("#news-" + news.id);
        //     let editableTextFieldContainer = container.querySelector(".news-card-body--deltaContent");
        //     let editableTextField = new EditableTextField(editableTextFieldContainer, news.content.delta, news.content.value, undefined, {readOnly: true});
        // })

        let deleteNews= function(){
            $('.news-delete').each(function(){
                $(this).on("click", function(e){
                    //push changes to server
                    e.preventDefault();
                    e.stopPropagation();
                    let newsId = e.currentTarget.dataset.id;
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
                                newsActions.delete(newsId, {}, {
                                    onSuccess: function(){
                                        window.location.reload();
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
                })
            })
        }
        let editNews = function(){
            $('.news-edit').each(function(){
                $(this).on("click", function(e){
                    //push changes to server
                    e.preventDefault();
                    e.stopPropagation();
                    let id = e.currentTarget.dataset.id;
                    window.location.href= "/dashboard/news/edit/"+id;
                })
            });
        }

        let sort = "created";
        let args = {
            height: "full",
            enableDropdowns: true,
            sorting: {
                property: sort,
                direction: -1,
            },
            grouping: {
                property: "created",
                mode: "smartDate",
            },
            view: "cards",
            acl: self.pageData.acl,
        }
        let callback = {
            listItem: {
                onClick: function(e){
                    let self = e.currentTarget;
                    e.preventDefault();
                    window.location = "/news/edit/"+self.dataset.id;

                }
            },
            customHandlers: [deleteNews, editNews],
        }

        //map data to months

        let container = this.container.querySelector('.newsList-container');
        let scrollableList = new ScrollableList(container, "news", this.data.news, args, callback);

    }

    getHtml(){
        return this.html;
    }
}
