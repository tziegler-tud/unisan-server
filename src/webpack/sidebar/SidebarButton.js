import {phone, tablet} from "../helpers/variables";

/**
 *
 * @param args {Object} constructor arguments
 * @param args.sidebar {Object} sidebar object to associate this button with
 * @param args.selector {string} container selector
 * @param args.type {string} "cancel", "confirm", "delete", "custom"
 * @param args.customHandler {Boolean} overwrite default function with custom handler.
 * @param args.handler {function} custom handler function. requires type "custom" or customHandler parameter set.
 * @param args.enabled {Boolean} true if the button should initially be enabled
 * @returns {SidebarButton}
 * @constructor
 */

export default class SidebarButton {
    constructor(args) {
        let defaultArgs = {
            sidebar: undefined,
            selector: undefined,
            type: "custom",
            customHandler: false,
            handler: ()=>{},
            enabled: true,
        }
        args = Object.assign(defaultArgs, args);
        this.sidebar = args.sidebar;
        this.selector = args.selector;
        this.type = args.type;
        this.customHandler = args.customHandler;
        this.handler = args.handler;
        this.enabled = args.enabled;

        if (this.selector === undefined) {
            console.error("Failed to create SidebarButton: No Selector")
            return false;
        }
        let item = document.querySelector(this.selector);
        if(item === undefined || item === null) {
            console.error("Failed to create SidebarButton: Invalid Selector")
            return false;
        }
        this.container = item;
        this.button = this.container.querySelector('button')
        if (this.button === null || this.button === undefined) this.button = this.container;

        if(this.type === undefined || typeof(this.type) !== "string") this.type = "custom";
        this.container.classList.add("sidebarButton");
        switch(this.type) {
            case "back":
                this.container.classList.add("sidebarButton--back");
                this.handler = () => {
                    this.sidebar.toggle();
                }
                break;
            case "confirm":
                this.container.classList.add("sidebarButton--confirm");
                break;
            case "allowed":
                this.container.classList.add("sidebarButton--allowed");
                break;
            case "cancel":
                this.container.classList.add("sidebarButton--cancel");
                this.handler = ()=>{
                    this.sidebar.showDefault((phone.matches || tablet.matches))
                }
                break;
            case "reset":
                this.container.classList.add("sidebarButton--reset");
                this.handler = () => {
                    this.sidebar.resetCurrentPage();
                }
                break;
            case "delete":
                this.container.classList.add("sidebarButton--delete");
                break;
            default:
            case "custom":
                this.container.classList.add("sidebarButton--custom");
                break;
        }
        if(this.customHandler){
            //overwrite default handler, if any is set
            this.handler = args.handler;
        }
        this.container.addEventListener("click", () => {
            if(this.enabled) {
                this.handler()
            }
        })
        if(!this.enabled){
            this.disable();
        }
    }

    /**
     * disables the button
     * @param disable {Boolean} Default: true. If set to false, no action is taken.
     */
    disable(disable){
        if(disable === undefined) disable = true;
        if(disable) {
            this.container.classList.add("sidebarButton-disabled");
            this.button.disabled = true;
            this.enabled = false;
        }
    }


    /**
     * enables the button
     * @param enable {Boolean} Default: true. If set to false, no action is taken.
     */
    enable(enable){
        if(enable === undefined) enable = true;
        if(enable) {
            this.container.classList.remove("sidebarButton-disabled");
            this.button.disabled = false;
            this.enabled = true;
        }
    }
}
