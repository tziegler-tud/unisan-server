import Handlebars from "handlebars";
import {userActions} from "../actions/userActions";
import ComponentPage from "./ComponentPage";

/**
 *
 * @param page {ComponentPage} parent page instance
 * @param componentId {String} component id number, assigend by page on creation
 * @param componentType {ComponentPage.componentTypes} type of the component
 * @param data {Object}
 * @param args {Object}
 * @param args.order {Integer} order inside componentContainer
 * @returns {Component}
 * @constructor
 */
export default class Component {
    constructor({page, componentId=Date.now(), componentType, pageData, data={}, args}={}) {
        let defaults = {
            allowEdit: true,
            acl: undefined,
            size: "full",
            classes: "",
            order: componentId,
            handlers: [],
        }
        args = (args === undefined) ? {} : args;
        this.args = Object.assign(defaults, args);
        this.page = page;
        this.data = data;
        this.pageData = pageData;
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
        this.handleData = {
            data: data
        };
        this.handleData.args = {
            allowEdit: this.args.allowEdit,
            acl: this.args.acl,
        };

        this.errorMessage = "Component " + this.componentId + " failed to render:"

        this.observers = [];
    }

    async renderComponent({pre = true, post = true}={}){
        let self = this;
        let result = {
            html: undefined,
            error: undefined,
            component: this,
        }

        self.handleData.data = self.data;
        self.handleData.pageData = self.pageData;

        try {
            if (pre) await self.preRender();

            let templateData = await $.get(self.templateUrl)
            let template = Handlebars.compile(templateData);
            self.container.innerHTML = template(self.handleData);
            let pageRenderResult = await self.page.renderComponentHtml(self.container);
            if(pageRenderResult.error) self.fail(pageRenderResult.error);
            else {
                self.postRenderInternal();
                if(post) {
                    await self.postRender();
                    return result;
                }
                else return result;
            }
        }
        catch(err) {
            self.fail(err);
        }
    }

    async preRender(){

    }

    async postRender(){

    }

    postRenderInternal(){
        this.container.style.order = this.args.order;
    }

    fail(error){
        console.error(this.errorMessage + ": " + error)
    }

    getHtml(){
        return this.html;
    }

    addObserver(observer){
        this.observers.push(observer);
    }

    emitEvent({event, data}){
        this.observers.forEach(observer=>{
            observer.inform({event: event, data: data})
        })
    }
}