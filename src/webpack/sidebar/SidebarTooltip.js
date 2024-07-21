import {MDCTooltip} from "@material/tooltip";

/**
 *
 * @param args
 * @param args.anchor {HTMLElement} anchor element
 * @param args.content {String} tooltip content
 * @returns {SidebarTooltip}
 * @constructor
 */
export default class SidebarTooltip {
    constructor(args) {
        let defaultArgs = {
            anchor: undefined,
            content: "",
        }
        this.state = "unset";
        if (args === undefined) args = {};
        this.args = Object.assign(defaultArgs, args);
        //find anchor
        this.anchor = this.args.anchor;
        if (this.anchor === undefined || this.anchor === null) {
            this.state = "failed";
            return this;
        }
        //create new tooltip
        let ttHtml = document.createElement("div");
        ttHtml.id = "tt" + Date.now();
        ttHtml.className = "mdc-tooltip";
        ttHtml.setAttribute("role", "tooltip");
        ttHtml.ariaHidden = "true";
        let inner = document.createElement("div");
        inner.className = "mdc-tooltip__surface mdc-tooltip__surface-animation";
        inner.innerHTML = this.args.content;
        ttHtml.append(inner);

        document.body.append(ttHtml);
        this.anchor.setAttribute("aria-describedby", ttHtml.id);
        this.mdcTooltip = new MDCTooltip(ttHtml);
        this.ttHtml = ttHtml;
        this.setContent = function (content) {
            if (typeof (content) === "string") {
                inner.innerHTML = content;
                return true;
            } else return false;
        }
        this.state = "active";
    }
}