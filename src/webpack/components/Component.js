import Handlebars from "handlebars";
import {userActions} from "../actions/userActions";
import {ComponentPage} from "./ComponentPage";

/**
 *
 * @param page {ComponentPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {ComponentPage.componentTypes} type of the component
 * @param data {Object}
 * @param args {Object}
 * @returns {Component}
 * @constructor
 */
export default class Component {
    constructor({page, componentId=Date.now(), componentType, data, args}={}) {
        let defaults = {
            allowEdit: true,
            size: "full",
            classes: "",
            order: componentId,
            handlers: [],

        }
        args = (args === undefined) ? {} : args;
        this.args = Object.assign(defaults, args);
        this.page = page;
        this.data = data;
        this.user = data.user;

        this.componentId = componentId;
        this.componentType = componentType;

        this.container = document.createElement("div");
        this.container.classList.add("componentPage-component-wrapper");
        switch (this.args.size) {
            case "full":
                this.container.classList.add("componentPage-component-wrapper--full")
                break;
            case "half":
                this.container.classList.add("componentPage-component-wrapper--half");
                break;
        }
        this.container.style.order = args.order;
        this.html = this.container;

        this.templateUrl = "";
        this.handleData = data;
        this.handleData.args = {
            allowEdit: this.args.allowEdit,
        };

        this.errorMessage = "Component " + this.componentId + " failed to render:"
    }

    async renderComponent({pre = true, post = true}={}){
        let self = this;
        let result = {
            html: undefined,
            error: undefined,
            component: this,
        }

        if (pre) await self.preRender();

        $.get(self.templateUrl, function (templateData) {
            let template = Handlebars.compile(templateData);
            self.container.innerHTML = template(self.handleData);
            self.page.renderComponentHtml(self.container)
                .then((resolve, reject)=>{
                    if(post) self.postRender()
                        .then(()=>{
                            return result;
                        })
                        .catch(err => {
                            self.fail(err);
                        })
                    else return result;
                })
                .catch(err => {
                    self.fail(err);
                })


        })
    }

    async preRender(){

    }

    async postRender(){

    }

    fail(error){
        console.error(this.errorMessage + ": " + error)
    }

    getHtml(){
        return this.html;
    }
}