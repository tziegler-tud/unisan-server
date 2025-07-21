import "./scrollableList.scss";
import "./scrollableListMobile.scss";
import Handlebars from "handlebars";
import "../helpers/handlebarsHelpers";
import { dateFromNow, refJSON, transformDateTimeString } from "../helpers/helpers";
import { DropdownMenu, Corner } from "../helpers/dropdownMenu";
import { phone } from "../helpers/variables";

interface Sorting {
    property: string | null;
    direction: number;
}

interface Grouping {
    property: string;
    mode: "smartDate" | "value";
}

export interface ScrollableListArgs {
    enableSorting?: boolean;
    enableMobile?: boolean;
    enableDropdowns?: boolean;
    view?: "list" | "cards";
    height?: "full" | "fixed" | "force-fixed" | "mobile";
    fixedHeight?: string;
    sorting?: Sorting;
    acl?: Record<string, any>;
    hasTitle?: boolean;
    title?: string;
    classes?: string;
    listcolumns?: string[];
    grouping?: Grouping;
}

export interface ListItemCallback {
    onClick?: (event: Event) => void;
}

export interface ScrollableListCallback {
    listItem?: ListItemCallback;
    customHandlers?: ((self: ScrollableList) => void)[];
}

interface Group {
    label: string;
    minDate?: Date;
    maxDate?: Date;
    items?: any[];
}

export default class ScrollableList {
    private static counter = 0;
    public id: number;
    public args: ScrollableListArgs;
    public data: any[];
    public groupedData: Group[] | undefined;
    public isGrouped: boolean;
    public initialData: any[];
    public callback: ScrollableListCallback | undefined;
    public container: HTMLElement;
    public type: string;
    public viewUrl: string | undefined;
    public templateUrl: { list: string; cards?: string; mobile?: string };
    public sorting: Sorting;
    public grouping: Grouping | undefined;
    public view: "list" | "cards" | "mobileList";
    public groupingObject: { property: string; mode: string } | undefined;

    constructor(
        container: HTMLElement,
        type: string = "generic",
        data: any[],
        args: ScrollableListArgs = {},
        callback?: ScrollableListCallback
    ) {
        if (!container) throw new Error("cannot instantiate list without container");
        this.id = ++ScrollableList.counter;
        this.args = {
            enableSorting: true,
            enableMobile: false,
            enableDropdowns: false,
            view: "list",
            height: "fixed",
            fixedHeight: "40em",
            sorting: { property: null, direction: 0 },
            acl: {},
            hasTitle: false,
            title: "test",
            classes: "",
            listcolumns: [],
            ...args,
        };
        this.data = data;
        this.initialData = [...data];
        this.callback = callback;
        this.container = container;
        this.type = type;
        this.viewUrl = undefined;
        this.templateUrl = this.applyType();
        this.sorting = this.args.sorting || { property: null, direction: 0 };
        this.grouping = this.args.grouping;
        this.view = this.applyView();
        this.sort(this.sorting.property, this.sorting.direction, false, false);
        if (this.grouping) {
            this.group(this.grouping.property, this.grouping.mode, false, false);
        }
        this.buildHTML(this.data, this.args);
        container.classList.add("scrollableList");
    }

    public setView(view: "list" | "cards" | "mobileList" | undefined): void {
        this.view = this.applyView(view);
        this.buildHTML(this.data, this.args);
    }

    public adjustList(): void {
        if (this.args.enableMobile) {
            if (this.view === "mobileList" && !phone.matches) {
                this.setView("list");
                return;
            }
            if (phone.matches && this.view === "list") {
                this.setView(this.view);
                return;
            }
        }
        const row = this.container.querySelector(".scrollableList-top") as HTMLElement;
        const listContent = this.container.querySelector(".scrollableList-content") as HTMLElement;
        let maxHeight: string = "40em";
        let height: string = "auto";
        const marginBottom: number = 20;
        let heightSetting: string | undefined = this.args.height;
        if (phone.matches) {
            heightSetting = "mobile";
            maxHeight = "unset";
        }
        if (heightSetting === "full") {
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            // @ts-ignore
            const topBarHeight = (window.DockerElement !== undefined) ? window.DockerElement.getTopBarHeight() : 50;
            const contentHeight = document.getElementById("content1-heading")?.clientHeight || 0;
            const spacers = Array.from(this.container.querySelectorAll(".scrollableList--spacer")) as HTMLElement[];
            const spacerHeight = spacers.reduce((acc, spacer) => acc + spacer.clientHeight, 0);
            maxHeight = `${vh - (topBarHeight + contentHeight + spacerHeight + row.clientHeight + marginBottom + 5)}px`;
        } else if (heightSetting === "fixed" || heightSetting === "force-fixed") {
            maxHeight = this.args.fixedHeight || "40em";
            height = heightSetting === "force-fixed" ? maxHeight : "auto";
        }
        this.container.style.margin = `0 0 ${marginBottom}px 0`;
        listContent.style.maxHeight = maxHeight;
        listContent.style.height = height;
        listContent.style.overflow = "auto";
        if (this.type === "generic") {
            const columnCount = this.args.listcolumns?.length || 0;
            this.container.querySelectorAll(".inner").forEach((element: any) => {
                element.style.gridTemplateColumns = `repeat(${columnCount}, 1fr)`;
            });
        }
        setTimeout(() => {
            const scrollbarWidth = listContent.offsetWidth - listContent.clientWidth;
            row.style.width = "auto";
            row.style.paddingRight = `${scrollbarWidth}px`;
        }, 200);
    }

    public sort(property: string | null, direction: number | string, forceRebuild = false, render = true): void {
        const dir = typeof direction === "string" ? (direction === "asc" ? 1 : direction === "desc" ? -1 : 0) : direction;
        this.sorting = { property, direction: dir };
        if (dir === 0) {
            if (forceRebuild || this.sorting.direction !== 0) {
                this.buildHTML(this.initialData, this.args);
            }
        } else {
            this.data = this.sortData(this.data, this.sorting);
            if (render) this.buildHTML(this.data, this.args);
        }
    }

    public group(property: string, mode: "smartDate" | "value", forceRebuild = false, render = true): void {
        if (!property) {
            this.isGrouped = false;
            return;
        }
        this.groupingObject = { property, mode };
        this.groupedData = mode === "smartDate" ? this.groupBySmartDate(this.data, property) : this.groupByValue(this.data, property);
        this.isGrouped = mode === "smartDate";
        if (render) this.buildHTML(this.data, this.args);
    }

    private applyView(view?: string): "list" | "cards" | "mobileList" {
        let result = view || this.args.view || "list";
        if (result === "list" && this.args.enableMobile && phone.matches) {
            result = "mobileList";
        }
        return result as "list" | "cards" | "mobileList";
    }

    private applyType(): { list: string; cards?: string; mobile?: string } {
        let urls: { list: string; cards?: string; mobile?: string } = { list: "" };
        switch (this.type) {
            case "userQualification": urls.list = "/webpack/scrollableList/templates/userQualificationList.hbs"; break;
            case "qualification": urls.list = "/webpack/scrollableList/templates/qualificationList.hbs"; break;
            case "log": urls.list = "/webpack/scrollableList/templates/logList.hbs"; break;
            case "user": urls.list = "/webpack/scrollableList/templates/userList.hbs"; break;
            case "participants": urls.list = "/webpack/scrollableList/templates/participantsList.hbs"; break;
            case "factoryPostings": urls = { list: "/webpack/scrollableList/templates/eventFactoryPostingsList.hbs", cards: "/webpack/scrollableList/templates/eventFactoryPostingsListCards.hbs", mobile: "/webpack/scrollableList/templates/postingsListMobile.hbs" }; break;
            case "postings": urls = { list: "/webpack/scrollableList/templates/postingsList.hbs", cards: "/webpack/scrollableList/templates/postingsListCards.hbs", mobile: "/webpack/scrollableList/templates/postingsListMobile.hbs" }; break;
            case "postingsPositions": urls = { list: "/webpack/scrollableList/templates/postingsList.hbs", cards: "/webpack/scrollableList/templates/postingsListPositionCards.hbs", mobile: "/webpack/scrollableList/templates/postingsListMobile.hbs" }; break;
            case "event": urls = { mobile: "/webpack/scrollableList/templates/eventListMobile.hbs", list: "/webpack/scrollableList/templates/eventList.hbs", cards: "/webpack/scrollableList/templates/eventCards.hbs" }; this.viewUrl = "/events/view/:id"; break;
            case "logDetails": urls.list = "/webpack/scrollableList/templates/logdetailsList.hbs"; break;
            case "news": urls = { mobile: "/webpack/scrollableList/templates/news/newsListMobile.hbs", list: "/webpack/scrollableList/templates/news/newsList.hbs", cards: "/webpack/scrollableList/templates/news/newsCards.hbs" }; break;
            default: urls = { mobile: "/webpack/scrollableList/templates/genericList.hbs", list: "/webpack/scrollableList/templates/genericList.hbs", cards: "/webpack/scrollableList/templates/genericCards.hbs" };
        }
        return urls;
    }

    private buildHTML(data: any[], args: ScrollableListArgs): void {
        const handleData: {
            listdata: any[];
            acl: Object | undefined;
            args: ScrollableListArgs;
            isGrouped?: boolean;
            groupedData?: Group[];
        } = {
            listdata: data,
            acl: args.acl,
            args
        };

        if (this.isGrouped) {
            handleData.isGrouped = true;
            handleData.groupedData = this.groupedData;
        }
        const fetchTemplate = (url: string) => fetch(url).then((res) => res.text());
        const compileAndRender = (template: string, renderFunc: (html: string) => void) => renderFunc(Handlebars.compile(template)(handleData));
        const buildList = (html: string) => {
            this.container.innerHTML = html;
            this.adjustList();
            this.setupEventHandlers();
            this.container.querySelectorAll(".scrollableList-header-column").forEach((el: any) => {
                if (el.dataset.property === this.sorting.property) el.classList.add(this.sorting.direction === 1 ? "sort-asc" : "sort-desc");
            });
        };
        const buildCards = (html: string) => { this.container.innerHTML = html; this.cardEventHandlers(); };
        const buildMobile = (html: string) => { this.container.innerHTML = html; this.setupEventHandlers(); };
        const render = (url: string, renderFunc: (html: string) => void) => fetchTemplate(url).then((template) => compileAndRender(template, renderFunc));

        switch (this.view) {
            case "cards": this.templateUrl.cards && render(this.templateUrl.cards, buildCards); break;
            case "mobileList": this.templateUrl.mobile && render(this.templateUrl.mobile, buildMobile); break;
            default: render(this.templateUrl.list, buildList);
        }
    }

    private sortData(data: any[], { property, direction }: Sorting): any[] {
        if (!property || !direction) return data;
        const dir = direction === 1 ? 1 : -1;
        return data.sort((a, b) => dir * (refJSON(a, property) < refJSON(b, property) ? -1 : refJSON(a, property) > refJSON(b, property) ? 1 : 0));
    }

    private sortByColumn(headerElement: HTMLElement): void {
        const property = headerElement.dataset.property;
        if (!property) { console.warn("failed to sort list: header property not set."); return; }
        this.sort(property, this.sorting.property === property ? (this.sorting.direction === 1 ? "desc" : this.sorting.direction === -1 ? 0 : "asc") : "asc");
    }

    private groupBySmartDate(data: any[], property: string): Group[] {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = dateFromNow({ days: -1 }, today);
        const lastWeek = dateFromNow({ weeks: -1 }, today);
        const groups: Group[] = [{ label: "Heute", minDate: today, maxDate: new Date() }, { label: "Gestern", minDate: yesterday, maxDate: today }, { label: "letzte Woche", minDate: lastWeek, maxDate: yesterday }];
        const sortIntoGroup = (item: any) => {
            const itemDate = new Date(item[property]);
            const group = groups.find((g) => g.minDate! <= itemDate && g.maxDate! > itemDate);
            if (group) { if (!group.items) group.items = []; group.items.push(item); } else {
                if (item[property] >= Date.now()) groups.push({ label: transformDateTimeString(itemDate).date, items: [item] });
                else {
                    const { monthYear } = transformDateTimeString(itemDate);
                    const minDate = new Date(itemDate); minDate.setDate(1); minDate.setHours(0, 0, 0, 0);
                    const maxDate = new Date(itemDate); maxDate.setMonth(maxDate.getMonth() + 1); maxDate.setDate(0); maxDate.setHours(23, 59, 59, 999);
                    groups.push({ label: monthYear, minDate, maxDate, items: [item] });
                }
            }
        };
        data.forEach(sortIntoGroup);
        return groups;
    }

    private groupByValue(data: any[], property: string): Group[] { return []; }

    private setupEventHandlers(): void {
        window.addEventListener("resize", () => this.adjustList());
        if (this.args.enableSorting) {
            this.container.querySelectorAll(".scrollableList-header-column").forEach((el: HTMLElement) => el.addEventListener("click", () => this.sortByColumn(el)));
        }
        if (this.callback) {
            if (this.callback.listItem?.onClick) {
                this.container.querySelectorAll(".scrollableList-item").forEach((el) => el.addEventListener("click", this.callback!.listItem!.onClick!));
            }
            this.callback.customHandlers?.forEach((handler) => handler(this));
        }
    }

    private cardEventHandlers(): void {
        if (this.viewUrl) {
            this.container.querySelectorAll(".viewKey-item").forEach((el: any) => el.addEventListener("click", () => window.location.href = this.viewUrl!.replace(":id", el.dataset.viewkey)));
        }
        if (this.callback) {
            if (this.callback.listItem?.onClick) {
                this.container.querySelectorAll(".scrollableList-item").forEach((el) => el.addEventListener("click", this.callback!.listItem!.onClick!));
            }
            this.callback.customHandlers?.forEach((handler) => handler(this));
        }
        if (this.args.enableDropdowns) {
            this.container.querySelectorAll(".card-menu-container").forEach((el: any) => new DropdownMenu(el, "click", el.querySelector(".card-menu-button"), { anchorCorner: Corner.BOTTOM_LEFT, fixed: true }));
        }
    }
}