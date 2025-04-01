import "./snackbar.scss";
import {MDCSnackbar} from '@material/snackbar';

/**
 * Snackbar
 * @param options
 * @param options.timeout {Number} timeout in ms
 * @param options.closeOnEscape {Boolean} true to close sidebar if action button is clicked
 * @param options.actionButton {Object}
 * @param options.actionButton.display {Boolean} true to show action button
 * @param options.actionButton.text {String} action button text
 * @returns {Snackbar}
 * @constructor
 */
var Snackbar = function(options){

    let defaultOptions = {
        timeout: 4000,
        closeOnEscape: false,
        actionButton: {
            display: false,
            text: "Okay",
        }
    }
    this.options = (options === undefined) ? {}: options;
    this.options = Object.assign(defaultOptions, options);

    //create DOM Element
    this.snackbarDom = document.createElement("div");
    this.snackbarDom.classList = "mdc-snackbar";
    let inner = '<div class="mdc-snackbar__surface" role="status" aria-relevant="additions">\n' +
        '            <div class="mdc-snackbar__label" aria-atomic="false">\n' +
        '                Hier könnte Ihre Meldung stehen.\n' +
        '            </div>\n' +
        '            <div class="mdc-snackbar__actions" aria-atomic="true">\n' +
        '                <div class="snackbar-action-seperator"></div>\n' +
        '                <button type="button" class="mdc-button mdc-snackbar__action">\n' +
        '                    <div class="mdc-button__ripple"></div>\n' +
        '                    <span class="mdc-button__label"></span>\n' +
        '                </button>\n' +
        '            </div>\n' +
        '\n' +
        '        </div>\n';

    this.snackbarDom.innerHTML = inner;

    //append to body
    $("body").append(this.snackbarDom);

    //initialize js
    let bar = new MDCSnackbar(this.snackbarDom);
    if(bar) {
        this.snackbar = bar;
    }
    else {
        console.error("Failed to build snackbar.")
    }
    return this;
}

/**
 *
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
Snackbar.prototype.show = function(message, options={}) {
    let self = this;
    let snackbar = self.snackbar;
    let defaultOptions = self.options;
    options = Object.assign(defaultOptions, options);
    if (!snackbar) {
        //try to find snackbar
        let bar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
        if(bar) {
            self.snackbar = bar;
            snackbar = bar;
        }
        else {
            return false;
        }
    }
    snackbar.close();
    snackbar.labelText = message;
    snackbar.timeoutMs = options.timeout;
    snackbar.closeOnEscape = options.closeOnEscape;
    if(options.actionButton.display) {
        snackbar.root.classList.add("show-action");
        snackbar.actionButtonText = options.actionButton.text;
    }
    else {
        snackbar.root.classList.remove("show-action");
    }
    snackbar.open()
}

/**
 *
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
Snackbar.prototype.showError = function(jqxhr, textstatus, error=undefined, options={}){
    let self = this;
    let snackbar = self.snackbar;
    let message = jqxhr.responseJSON.message;
    let text = (error ? error: "Error " + jqxhr.status) +": " + (message ? message : jqxhr.responseText);
    let defaultOptions = {
        timeout: -1,
        closeOnEscape: true,
        actionButton: {
            display: true,
            text: "Nagut",
        }
    }
    options = Object.assign(defaultOptions, options);
    this.show(text, options);
}

/**
 *
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
Snackbar.prototype.showCustomError = function(message, textstatus, error=undefined, options={}){
    let self = this;
    let snackbar = self.snackbar;
    let text = (error ? error: "Error " + textstatus) +": " + message;
    let defaultOptions = {
        timeout: -1,
        closeOnEscape: true,
        actionButton: {
            display: true,
            text: "Nagut",
        }
    }
    options = Object.assign(defaultOptions, options);
    this.show(text, options);
}

export {Snackbar}