import "./snackbar.scss";
import { MDCSnackbar } from "@material/snackbar";

export interface SnackbarOptions {
    timeout?: number;
    closeOnEscape?: boolean;
    actionButton?: {
        display?: boolean;
        text?: string;
    };
}

/**
 * Snackbar
 * @param [options]
 * @param options.timeout {Number} timeout in ms
 * @param options.closeOnEscape {Boolean} true to close sidebar if action button is clicked
 * @param options.actionButton {Object}
 * @param options.actionButton.display {Boolean} true to show action button
 * @param options.actionButton.text {String} action button text
 * @returns {Snackbar}
 * @constructor
 */
export default class Snackbar {
    options: SnackbarOptions;
    snackbarDom: HTMLDivElement;
    snackbar?: MDCSnackbar;

    constructor(options?: SnackbarOptions) {
        const defaultOptions: SnackbarOptions = {
            timeout: 4000,
            closeOnEscape: false,
            actionButton: {
                display: false,
                text: "Okay",
            },
        };

        this.options = { ...defaultOptions, ...options };

        //create DOM Element
        this.snackbarDom = document.createElement("div");
        this.snackbarDom.classList.add("mdc-snackbar");
        this.snackbarDom.innerHTML = `<div class="mdc-snackbar__surface" role="status" aria-relevant="additions">
            <div class="mdc-snackbar__label" aria-atomic="false">
                Hier könnte Ihre Meldung stehen.
            </div>
            <div class="mdc-snackbar__actions" aria-atomic="true">
                <div class="snackbar-action-seperator"></div>
                <button type="button" class="mdc-button mdc-snackbar__action">
                    <div class="mdc-button__ripple"></div>
                    <span class="mdc-button__label"></span>
                </button>
            </div>
        </div>`;

        //append to body
        $("body").append(this.snackbarDom);
            //initialize js
            const bar = new MDCSnackbar(this.snackbarDom);
            if (bar) {
                this.snackbar = bar;
            } else {
            console.error("Failed to build snackbar.");
        }
    }

    /**
     * shows the snackbar with given content
     *
     * @param message {String} snackbar message
     * @param options {Object}
     * @param options.timeout {Number} timeout in ms
     * @param options.closeOnEscape {Boolean} true to close sidebar if action button is clicked
     * @param options.actionButton {Object}
     * @param options.actionButton.display {Boolean} true to show action button
     * @param options.actionButton.text {String} action button text
     * @returns {boolean}
     */
    show(message: string, options: SnackbarOptions = {}): boolean {
        let snackbar = this.snackbar;
        const mergedOptions = { ...this.options, ...options };

        if (!snackbar) {
            //try to find snackbar
            const bar = new MDCSnackbar(document.querySelector(".mdc-snackbar") as HTMLElement);
            if (bar) {
                this.snackbar = bar;
                snackbar = bar;
            } else {
                return false;
            }
        }
        snackbar.close();
        snackbar.labelText = message;
        snackbar.timeoutMs = mergedOptions.timeout || 4000;
        snackbar.closeOnEscape = mergedOptions.closeOnEscape || false;
        if (mergedOptions.actionButton?.display) {
            snackbar.root.classList.add("show-action");
            snackbar.actionButtonText = mergedOptions.actionButton.text || "Okay";
        } else {
            snackbar.root.classList.remove("show-action");
        }
        snackbar.open();
        return true;
    }

    /**
     * shows an jqxhr error in the snackbar
     *
     * @param jqxhr {Object} jqxhr object
     * @param textstatus {String} string containing status message
     * @param error {Error} error Object
     * @param options {Object}
     * @param options.timeout {Number} timeout in ms
     * @param options.closeOnEscape {Boolean} true to close sidebar if action button is clicked
     * @param options.actionButton {Object}
     * @param options.actionButton.display {Boolean} true to show action button
     * @param options.actionButton.text {String} action button text
     * @returns {boolean}
     */
    showError(jqxhr: { responseJSON: { message: string }; status: number; responseText: string }, textstatus: string, error?: Error, options: SnackbarOptions = {}): boolean {
        const message = jqxhr.responseJSON?.message;
        const text = (error ? error.message : `Error ${jqxhr.status}`) + `: ${message || jqxhr.responseText}`;
        const defaultOptions: SnackbarOptions = {
            timeout: -1,
            closeOnEscape: true,
            actionButton: {
                display: true,
                text: "Nagut",
            },
        };
        const mergedOptions = { ...defaultOptions, ...options };
        return this.show(text, mergedOptions);
    }

    /**
     * shows an error in the snackbar
     *
     * @param message {string}
     * @param textstatus {String} string containing status message
     * @param error {Error} error Object
     * @param options {Object}
     * @param options.timeout {Number} timeout in ms
     * @param options.closeOnEscape {Boolean} true to close sidebar if action button is clicked
     * @param options.actionButton {Object}
     * @param options.actionButton.display {Boolean} true to show action button
     * @param options.actionButton.text {String} action button text
     * @returns {boolean}
     */
    showCustomError(message: string, textstatus: string, error?: Error, options: SnackbarOptions = {}): boolean {
        const text = (error ? error.message : `Error ${textstatus}`) + `: ${message}`;
        const defaultOptions: SnackbarOptions = {
            timeout: -1,
            closeOnEscape: true,
            actionButton: {
                display: true,
                text: "Nagut",
            },
        };
        const mergedOptions = { ...defaultOptions, ...options };
        return this.show(text, mergedOptions);
    }
}