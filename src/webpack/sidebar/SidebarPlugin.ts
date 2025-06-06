import ContentHandler from "./ContentHandler";

/**
 * Sidebar plugins extends the sidebar functionality by providing handlers for custom content types.
 */
export default class SidebarPlugin {
    name: string;
    handlers: ContentHandler[] = [];

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Adds a content handler to the sidebar plugin instance.
     *
     * @param {ContentHandler} contentHandler - content handler
     */
    addContentHandler(contentHandler: ContentHandler): void {
        this.handlers.push(contentHandler);
    }
}