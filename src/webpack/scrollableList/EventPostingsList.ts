import "./scrollableList.scss";
import "./scrollableListMobile.scss";
import "./EventPostingsList.scss";
import Handlebars from "handlebars";
import "../helpers/handlebarsHelpers";
import { dateFromNow, refJSON, transformDateTimeString } from "../helpers/helpers";
import { DropdownMenu, Corner } from "../helpers/dropdownMenu";
import { phone } from "../helpers/variables";
import {IPosition, IPosting} from "../types/Event";
import {getTemplate} from "../utils/utils";

export interface PositionGroup {
    id?: number|string,
    title: string,
    description: string,
    postings: IPosting[],
    assigned: number,
    total: number,
}

export interface EventPostingsListArgs {
    enableMobile?: boolean;
    enableDropdowns?: boolean;
    acl?: Record<string, any>;
    hasTitle?: boolean;
    title?: string;
    classes?: string;
    allowEdit?: boolean,
}

export interface EventPostingsListCallback {
    listItem?: EventPostingsListItemCallback;
    listHeader: EventPostingsListHeaderCallback;
    customHandlers?: ((self: EventPostingsList) => void)[];
}
export interface EventPostingsListHeaderCallback {
    onClick?: (event: Event) => void;
}
export interface EventPostingsListItemCallback {
    onClick?: (event: Event) => void;
    dropOnPosition?: (postingId: string, positionId: string) => void;
}

export default class EventPostingsList {
    public id: string;
    public args: EventPostingsListArgs;
    public initialData: any[];
    public callback: EventPostingsListCallback | undefined;
    public container: HTMLElement;
    public type: string;
    public viewUrl: string | undefined;
    public templateUrl: string;

    private positionHeaderElements: NodeListOf<HTMLElement>;
    private positionListContainers: NodeListOf<HTMLElement>;
    private groupContainers: NodeListOf<HTMLElement>;

    private positions: PositionGroup[];

    constructor(
        container: HTMLElement,
        positions: PositionGroup[],
        args: EventPostingsListArgs = {},
        callback?: EventPostingsListCallback
    ) {
        if (!container) throw new Error("cannot instantiate list without container");
        this.id = "eventPostingList";
        this.args = {
            enableMobile: false,
            enableDropdowns: false,
            acl: {},
            hasTitle: false,
            title: "test",
            classes: "",
            allowEdit: false,
            ...args,
        };
        this.positions = positions
        this.callback = callback;
        this.container = container;
        this.viewUrl = undefined;
        this.templateUrl =  "/webpack/scrollableList/templates/EventPostingsList/EventPostingsList.hbs";

        container.classList.add("scrollableList");
    }

    public async render(){
        await this._buildHTML();
    }

    public adjustList(): void {

    }

    public setPositions(positions: PositionGroup[]) {
        this.positions = positions;
    }

    private async _buildHTML(): Promise<void> {

        const handleData: {
            positions: PositionGroup[];
            acl: Object | undefined;
            args: EventPostingsListArgs;
        } = {
            positions: this.positions,
            acl: this.args.acl,
            args: this.args,
        };

        const template = await getTemplate(this.templateUrl);
        const html = Handlebars.compile(template)(handleData)
        this.container.innerHTML = html;

        this.groupContainers = this.container.querySelectorAll(".eventPostingsList-groupContainer");
        this.positionHeaderElements = this.container.querySelectorAll(".eventPostingsList-group-header");
        this.positionListContainers = this.container.querySelectorAll(".eventPostingsList-group-list");

        this.cardEventHandlers();

        this.setupDragEventHandlers();
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

    private setupDragEventHandlers(): void {
        this.positionListContainers.forEach((el: HTMLUListElement) => {
            el.querySelectorAll(".eventPostingsList-listitem").forEach((listItem: HTMLLIElement) => {
                listItem.addEventListener("dragstart", (e: DragEvent) => {
                    const postingId =  listItem.dataset.postingid;
                    e.dataTransfer.setData("text/plain", postingId);
                });
                listItem.addEventListener("dragend", (e: DragEvent) => {
                    this._endDragEvent();
                });
                listItem.addEventListener("dragover", (e: DragEvent) => {
                    e.preventDefault();
                })
            })
        })

        this.positionHeaderElements.forEach((el: HTMLElement) => {
            if (this.callback) {
                if (this.callback.listHeader?.onClick) {
                    el.addEventListener("click", (e: Event) => {
                        this.callback!.listHeader!.onClick!(e)
                    })
                }
            }
        })

        this.groupContainers.forEach((el: HTMLElement) => {
            el.addEventListener("dragover", (e: DragEvent) => {
                e.preventDefault();
                el.classList.add("dragover");
            })
            el.addEventListener("dragleave", (e: DragEvent) => {
                e.preventDefault();
                el.classList.remove("dragover");
            })
            el.addEventListener("drop", (e: DragEvent) => {
                e.preventDefault();
                const positionId = el.dataset.positionid;
                const postingId = e.dataTransfer.getData("text/plain");

                if (this.callback) {
                    if (this.callback.listItem?.dropOnPosition){
                        this.callback.listItem?.dropOnPosition(postingId, positionId);
                    }
                }
            })
        })
    }

    private _endDragEvent(){
        this.groupContainers.forEach((el: HTMLElement) => {
            el.classList.remove("dragover");
        })
    }
}
