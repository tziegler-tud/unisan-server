import Sidebar from "./Sidebar";
import { phone, tablet } from "../helpers/variables";

interface SidebarButtonArgs {
    sidebar?: Sidebar;
    selector?: string;
    type?: "back" | "confirm" | "allowed" | "cancel" | "reset" | "delete" | "custom";
    customHandler?: boolean;
    handler?: () => void;
    enabled?: boolean;
}

/**
 * @param args {Object} constructor arguments
 * @param args.sidebar {Sidebar} sidebar object to associate this button with
 * @param args.selector {string} container selector
 * @param args.type {string} "cancel", "confirm", "delete", "custom"
 * @param args.customHandler {Boolean} overwrite default function with custom handler.
 * @param args.handler {function} custom handler function. requires type "custom" or customHandler parameter set.
 * @param args.enabled {Boolean} true if the button should initially be enabled
 * @returns {SidebarButton}
 * @constructor
 */
export default class SidebarButton {
    private sidebar?: Sidebar;
    private selector?: string;
    private type: "back" | "confirm" | "allowed" | "cancel" | "reset" | "delete" | "custom";
    private customHandler: boolean;
    private handler: () => void;
    private enabled: boolean;
    private container: HTMLElement;
    private button: HTMLButtonElement | HTMLElement;

    constructor(args: SidebarButtonArgs) {
        const defaultArgs: SidebarButtonArgs = {
            sidebar: undefined,
            selector: undefined,
            type: "custom",
            customHandler: false,
            handler: () => {},
            enabled: true,
        };

        const mergedArgs = { ...defaultArgs, ...args };
        this.sidebar = mergedArgs.sidebar;
        this.selector = mergedArgs.selector;
        this.type = mergedArgs.type ?? "custom";
        this.customHandler = mergedArgs.customHandler ?? false;
        this.handler = mergedArgs.handler ?? (() => {});
        this.enabled = mergedArgs.enabled ?? true;

        if (!this.selector) {
            console.error("Failed to create SidebarButton: No Selector");
            return;
        }

        const item = document.querySelector(this.selector);
        if (!item) {
            console.error("Failed to create SidebarButton: Invalid Selector");
            return;
        }

        this.container = item as HTMLElement;
        this.button = (this.container.querySelector("button") as HTMLButtonElement) || this.container;

        this.container.classList.add("sidebarButton");

        switch (this.type) {
            case "back":
                this.container.classList.add("sidebarButton--back");
                this.handler = () => {
                    if (this.sidebar) {
                        this.sidebar.toggle();
                    }
                };
                break;
            case "confirm":
                this.container.classList.add("sidebarButton--confirm");
                break;
            case "allowed":
                this.container.classList.add("sidebarButton--allowed");
                break;
            case "cancel":
                this.container.classList.add("sidebarButton--cancel");
                this.handler = () => {
                    if (this.sidebar) {
                        this.sidebar.showDefault(phone.matches || tablet.matches);
                    }
                };
                break;
            case "reset":
                this.container.classList.add("sidebarButton--reset");
                this.handler = () => {
                    if (this.sidebar) {
                        this.sidebar.resetCurrentPage();
                    }
                };
                break;
            case "delete":
                this.container.classList.add("sidebarButton--delete");
                break;
            default:
                this.container.classList.add("sidebarButton--custom");
                break;
        }

        if (this.customHandler && mergedArgs.handler) {
            this.handler = mergedArgs.handler;
        }

        this.container.addEventListener("click", () => {
            if (this.enabled) {
                this.handler();
            }
        });

        if (!this.enabled) {
            this.disable();
        }
    }

    /**
     * disables the button
     * @param disable {Boolean} Default: true. If set to false, no action is taken.
     */
    disable(disable: boolean = true): void {
        if (disable) {
            this.container.classList.add("sidebarButton-disabled");
            if(this.button instanceof HTMLButtonElement){
                this.button.disabled = true;
            }
            this.enabled = false;
        }
    }

    /**
     * enables the button
     * @param enable {Boolean} Default: true. If set to false, no action is taken.
     */
    enable(enable: boolean = true): void {
        if (enable) {
            this.container.classList.remove("sidebarButton-disabled");
            if(this.button instanceof HTMLButtonElement){
                this.button.disabled = false;
            }
            this.enabled = true;
        }
    }
}