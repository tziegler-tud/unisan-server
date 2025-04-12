import "./sidebar.scss";
import "./sidebar-logs.scss";

import { refJSON } from "../helpers/helpers";
import SidebarPlugin from "./SidebarPlugin";
import SidebarButton from "./SidebarButton";
import ContentHandler from "./ContentHandler";

export interface HandlerFunctionError {
    message: string;
}
export interface HandlerFunctionResult {
    errors?: HandlerFunctionError[];
}

class StorageObject {
    handler: ContentHandler;
    handlerContent: any;
    page: SidebarPage

    constructor(handler: ContentHandler, handlerContent: any, page: SidebarPage) {
        this.handler = handler;
        this.handlerContent = handlerContent;
        this.page = page;
    }
}

class SidebarPage {
    type: string;
    args: any;

    constructor(type: string, args: any) {
        this.type = type;
        this.args = args;
    }
}

class SidebarCounter {
    private static counter: number = 0;

    static next(): number {
        return ++SidebarCounter.counter;
    }

    static current(): number {
        return SidebarCounter.counter;
    }
}

export default class Sidebar {
    private plugins: SidebarPlugin[] = [];
    private contentHandlers: ContentHandler[] = [];
    private parent: JQuery;
    private readonly domId: string;
    private isActive: boolean = false;
    private hasDefault: boolean = false;
    private defaultPage: { type: string | undefined; args: any } = { type: undefined, args: {} };
    private readonly sidebarHTML: JQuery;
    private currentPage: { type: string; args: any; handler?: ContentHandler } | null = null;

    constructor(parentId: string, optionalId?: string) {
        this.parent = $(`#${parentId}`);
        this.domId = optionalId ?? `sidebar${SidebarCounter.next()}`;
        this.sidebarHTML = $("<div/>", { id: this.domId, class: "sidebar-container" });
        this.parent.append(this.sidebarHTML);
    }

    addContentHandler(contentHandler: ContentHandler): void {
        this.contentHandlers.push(contentHandler);
    }

    addPlugin(sidebarPlugin: SidebarPlugin): boolean {
        if (!this.plugins.some((plugin) => plugin.name === sidebarPlugin.name)) {
            this.plugins.push(sidebarPlugin);
            sidebarPlugin.handlers.forEach((handler) => this.addContentHandler(handler));
        }
        return true;
    }

    async addContent(type: string, args: any): Promise<HandlerFunctionResult> {
        this.currentPage = new SidebarPage(type, args);
        const handler = this.contentHandlers.find((handler) => handler.type === type);
        if (!handler) {
            console.error(`Sidebar error: No handler found for given content type: ${type}`);
            throw new Error("Sidebar error: No handler found for given content type: " + type);
        }
        this.currentPage!.handler = handler;
        return await handler.apply(this, args, type);
    }

    async addSubpage(type: string, args: any): Promise<StorageObject> {
        const storageObject = this.saveContent();
        await this.addContent(type, args);
        return storageObject;
    }

    saveContent(): StorageObject {
        const handler = this.currentPage!.handler!;
        const handlerContent = handler.save();
        return { page: this.currentPage!, handler, handlerContent };
    }

    async loadContent(storageObject: StorageObject): Promise<void> {
        await this.addContent(storageObject.page.type, storageObject.page.args)
        storageObject.handler.load(storageObject.handlerContent);
    }

    setDefault(type: string, args: any): void {
        this.defaultPage = { type, args };
        this.hasDefault = true;
    }

    setCurrentDefault(): void {
        this.defaultPage = { type: this.currentPage!.type, args: this.currentPage!.args };
        this.hasDefault = true;
    }

    async showDefault(hide: boolean = false): Promise<void> {
        if (!this.hasDefault) {
            await this.resetCurrentPage();
            this.hide();
        } else {
            await this.addContent(this.defaultPage.type!, this.defaultPage.args);
            if (hide) this.hide();
        }
    }

    async update(args: any): Promise<void> {
        const newArgs = { ...this.currentPage!.args, ...args };
        await this.addContent(this.currentPage!.type, newArgs);
    }

    toggle(): void {
        this.isActive = !this.isActive;
        this.sidebarHTML.toggleClass("sidebar-active", this.isActive);
        this.parent.toggleClass("sidebar-active", this.isActive);
        $("body").toggleClass("noscroll", this.isActive);
    }

    show(): void {
        this.sidebarHTML.addClass("sidebar-active");
        this.parent.addClass("sidebar-active");
        $("body").addClass("noscroll");
        this.isActive = true;
    }

    hide(): void {
        this.sidebarHTML.removeClass("sidebar-active");
        this.parent.removeClass("sidebar-active");
        $("body").removeClass("noscroll");
        this.isActive = false;
    }

    addErrorMessage(msg: string = "Something went wrong", insertFunc?: (errorHtml: HTMLElement) => void, overwrite: boolean = false, warning: boolean = false): void {
        if (overwrite) {
            $(".sidebar-errorMsg").remove();
        }
        const errorHtml = document.createElement("div");
        errorHtml.className = `sidebar-errorMsg ${warning ? "warnMsg" : ""}`;
        errorHtml.textContent = msg;
        if (insertFunc) {
            try {
                insertFunc(errorHtml);
            } catch (e) {
                console.error(e);
            }
        } else {
            this.sidebarHTML.prepend(errorHtml);
        }
    }

    enableOptional(selector: string): void {
        $(selector).addClass("optional-enabled");
    }

    disableOptional(selector: string): void {
        $(selector).removeClass("optional-enabled");
    }

    registerBackButton(selector: string, args: any = {}): SidebarButton {
        return new SidebarButton({ sidebar: this, selector, type: "back", customHandler: false, handler: () => this.toggle(), enabled: true, ...args });
    }

    registerResetButton(selector: string, args: any = {}): SidebarButton {
        return new SidebarButton({ sidebar: this, selector, type: "reset", customHandler: false, handler: () => {}, enabled: true, ...args });
    }

    registerCancelButton(selector: string, args: any = {}): SidebarButton {
        return new SidebarButton({ sidebar: this, selector, type: "cancel", customHandler: false, handler: () => {}, enabled: true, ...args });
    }

    registerConfirmButton(selector: string, args: any = {}): SidebarButton {
        return new SidebarButton({ sidebar: this, selector, type: "confirm", customHandler: true, handler: () => {}, enabled: true, ...args });
    }

    registerDeleteButton(selector: string, args: any = {}): SidebarButton {
        return new SidebarButton({ sidebar: this, selector, type: "delete", customHandler: true, handler: () => {}, enabled: true, ...args });
    }

    registerButton(selector: string, args: any = {}): SidebarButton {
        return new SidebarButton({ sidebar: this, selector, type: "custom", customHandler: true, handler: () => {}, enabled: true, ...args });
    }

    getDataFromServer(url: string, callback: (context: any) => void): void {
        $.ajax({
            url: url,
            type: "GET",
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            cache: false,
            // isModified: false,
            data: {},
            success: callback
        });
    }

    findQualByIdInTypeArray(byTypeArr: any[], qualId: string): any {
        return byTypeArr.flatMap((qual: any) => qual.values).find((qualEntry: any) => qualEntry._id === qualId) || null;
    }

    populateCurrentQualificationDefault(doc: any[], current: any, args: any = {}): boolean {
        if (!this.checkQualificationDataValidity(current)) return false;
        const typeData = doc.find((element) => element._id === current.qualType);
        const qualNameObject = document.getElementById("qual-name") as HTMLSelectElement;
        const q = document.getElementById("qual-type") as HTMLSelectElement;

        $(q).children("option").filter((i, e) => e.text === current.qualType).prop("selected", true);
        typeData.values.forEach((el: any, index: number) => {
            const option = document.createElement("option");
            option.id = el._id;
            option.value = el.name;
            option.textContent = el.name;
            option.selected = el.name === current.name;
            qualNameObject.options[index] = option;
        });
        if (args.addCreateEntry) {
            qualNameObject.append(this.createSelectDelimiter());
            const createEntry = document.createElement("option");
            createEntry.textContent = "Neu anlegen...";
            createEntry.value = "enableOptional_custom-name";
            createEntry.classList.add("option-createNewEntry");
            qualNameObject.append(createEntry);
        }
        return true;
    }

    createSelectDelimiter(): HTMLOptionElement {
        const delimiter = document.createElement("option");
        delimiter.textContent = "-----------------------";
        delimiter.disabled = true;
        return delimiter;
    }

    findExistingValues(doc: any, key: string): any {
        const val = refJSON(doc, key);
        return Array.isArray(val) ? undefined : val;
    }

    checkQualificationDataValidity(currentQualification: any): boolean {
        return !!currentQualification && !!currentQualification.qualType && !!currentQualification.name;
    }

    checkDataValidity(field: any, dataset: any): [number, string] {
        const errorList: string[] = Object.entries(dataset).filter(([key, value]) => typeof field[key] !== value).map(([key]) => key);
        if (errorList.length > 0) return [1, `Failed to read data: ${errorList.join(", ")}`];
        return [0, ""];
    }

    async resetCurrentPage(): Promise<void> {
        await this.addContent(this.currentPage!.type, this.currentPage!.args);
    }

    setHTMLContent(html: string) {
        this.sidebarHTML.html(html);
    }
}