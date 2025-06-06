import { MDCTooltip } from "@material/tooltip";

interface SidebarTooltipArgs {
    anchor?: HTMLElement;
    content?: string;
}

/**
 * @param args
 * @param args.anchor {HTMLElement} anchor element
 * @param args.content {String} tooltip content
 * @returns {SidebarTooltip}
 * @constructor
 */
export default class SidebarTooltip {
    private anchor?: HTMLElement;
    private mdcTooltip: MDCTooltip;
    private ttHtml: HTMLElement;
    private state: "unset" | "failed" | "active" = "unset";
    private args: SidebarTooltipArgs;

    constructor(args: SidebarTooltipArgs = {}) {
        const defaultArgs: SidebarTooltipArgs = {
            anchor: undefined,
            content: "",
        };

        this.args = { ...defaultArgs, ...args };
        this.anchor = this.args.anchor;

        if (!this.anchor) {
            this.state = "failed";
            return;
        }

        const ttHtml = document.createElement("div");
        ttHtml.id = "tt" + Date.now();
        ttHtml.className = "mdc-tooltip";
        ttHtml.setAttribute("role", "tooltip");
        ttHtml.ariaHidden = "true";

        const inner = document.createElement("div");
        inner.className = "mdc-tooltip__surface mdc-tooltip__surface-animation";
        inner.innerHTML = this.args.content || "";

        ttHtml.append(inner);
        document.body.append(ttHtml);
        this.anchor.setAttribute("aria-describedby", ttHtml.id);

        this.mdcTooltip = new MDCTooltip(ttHtml);
        this.ttHtml = ttHtml;
        this.setContent = (content: string): boolean => {
            if (typeof content === "string") {
                inner.innerHTML = content;
                return true;
            }
            return false;
        };

        this.state = "active";
    }

    setContent: (content: string) => boolean;
}