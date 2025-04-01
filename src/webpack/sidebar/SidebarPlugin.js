/**
 *
 * Sidebar plugins extends the sidebar functionality by providing handlers for custom content types.
 *
 * @param name {String}
 * @returns {SidebarPlugin}
 * @constructor
 */
export default class SidebarPlugin {
    constructor(name) {
        this.name = name;
        this.handlers = [];
        return this;
    }

    /**
     *
     * adds a content handler to the sidebar plugin instance.
     *
     * @param {ContentHandler} contentHandler - content handler
     */
    addContentHandler(contentHandler) {
        this.handlers.push(contentHandler);
    }
}