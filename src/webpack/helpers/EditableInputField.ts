import "./editableInputField.scss";
import "./editor.scss";
import Quill from "quill";
import Delta from "quill-delta";
import '/lib/quill/quill.snow-custom.css';
import '/lib/quill/quill.bubble-custom.css';

/**
 * Interface for the callback functions.
 */
interface EditableInputFieldCallbacks {
    onConfirm?: (instance: EditableInputField) => void;
}

/**
 * Interface for the constructor arguments.
 */
interface EditableInputFieldArgs {
    active?: boolean;
    disableButtons?: boolean;
    readOnly?: boolean;
    limit?: number;
}

/**
 * Interface for the dialog DOM elements.
 */
interface EditableInputFieldDialogDOM {
    container: HTMLDivElement;
    confirmButton: HTMLDivElement;
    cancelButton: HTMLDivElement;
}

export default class EditableInputField {
    static readonly cssClassName = "editableInputField";
    static readonly cssHiddenClassName = "input-hidden";
    static readonly cssActiveClassName = "input-active";
    static readonly cssAllowEditingClassName = "allow-editing";
    static cssAdditionalClassNames: string[] = [];

    private quill: Quill | undefined;
    private domElements: { [key: string]: HTMLElement } = {};
    private id: number;
    private container: HTMLElement;
    private deltaContent: Delta; // Assuming deltaContent is a Quill Delta object
    private quillcontainer: HTMLDivElement;
    private active: boolean;
    private disableButtons: boolean;
    private readOnly: boolean;
    private limit: number;
    private isactive: boolean = false;
    private callback: EditableInputFieldCallbacks;
    private dialogDOM!: EditableInputFieldDialogDOM; // Initialized in buildHTML

    static counter = {
        current: 0,
        next: function(): number {
            this.current++;
            return this.current;
        }
    }

    /**
     * Constructor for EditableInputField objects
     *
     * @param container - container DOM element
     * @param deltaContent - delta object to set as content
     * @param type - input type. ["text"]
     * @param callback - callbacks to be executed when dialog buttons are used. currently, only 'onConfirm' is supported
     * @param args - readOnly: [false] disable input., active: [false] initialize with active editor, disableButtons: [false] disables dialog buttons, limit: [0] maximum amount of characters. Value 0 disables character limit.
     * @returns {EditableInputField}
     * @constructor
     */
    constructor(
        container: HTMLElement,
        deltaContent: Delta,
        type: string = "text",
        callback?: EditableInputFieldCallbacks,
        args?: EditableInputFieldArgs
    ) {
        if (container === undefined) {
            throw new Error("Cannot instantiate input field without container");
        }
        if(args === undefined) args = {};
        this.callback = callback === undefined ? { onConfirm: () => { console.log("No callback given"); } } : callback;
        this.id = EditableInputField.counter.next();

        container.classList.add(EditableInputField.cssClassName, EditableInputField.cssHiddenClassName, ...EditableInputField.cssAdditionalClassNames);

        if (!args.readOnly) {
            container.classList.add(EditableInputField.cssAllowEditingClassName);
        }

        this.container = container;
        this.deltaContent = deltaContent;

        this.quillcontainer = document.createElement("div");
        this.quillcontainer.className = "text-editor";

        this.active = args.active;
        this.disableButtons = args.disableButtons;
        this.readOnly = args.readOnly;
        this.limit = args.limit;

        const toolbarOptions = [
            ['bold', 'italic', 'underline'],
            // @ts-ignore
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ];

        const quill = new Quill(this.quillcontainer, {
            theme: 'bubble',
            modules: {
                toolbar: toolbarOptions,
                clipboard: {
                    matchVisual: false // Using matchVisual instead of newLines based on Quill's documentation
                },
                keyboard: {
                    bindings: {
                        enter: {
                            key: 13,
                            handler: function() {
                                return false;
                            }
                        }
                    }
                },
            },
            bounds: this.quillcontainer,
        });
        quill.setContents(this.deltaContent);

        this.quill = quill;

        // Deactivate on default
        if (this.active === true) {
            this.activate();
        } else {
            this.deactivate();
        }
    }

    private buildHTML(): HTMLDivElement {
        let id = this.id;
        let buttonContainer = document.createElement("div");
        buttonContainer.className = "editableInputField-dialog-container";
        buttonContainer.id = "editableInputField-dialog-container" + id;
        if (this.disableButtons === true) buttonContainer.style.display = "none";

        // Add confirm button
        let confirmButton = document.createElement("div");
        confirmButton.className = "editableInputField-dialog-button editableInputField-dialog-confirmButton";
        confirmButton.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-check\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg>";

        // Add cancel button
        let cancelButton = document.createElement("div");
        cancelButton.className = "editableInputField-dialog-button editableInputField-dialog-cancelButton";
        cancelButton.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-x\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line></svg>";

        buttonContainer.append(confirmButton);
        buttonContainer.append(cancelButton);

        this.dialogDOM = {
            container: buttonContainer,
            confirmButton: confirmButton,
            cancelButton: cancelButton,
        } as EditableInputFieldDialogDOM; // Type assertion

        return buttonContainer;
    }

    public deactivate(): void {
        this.isactive = false;
        // Create div
        let textContainer = document.createElement("div");
        textContainer.className = "quill-render-text ";
        // Ensure quill is initialized before calling its methods
        if (this.quill) {
            textContainer.insertAdjacentHTML("beforeend", this.quill.getSemanticHTML());
        }
        this.container.innerHTML = "";
        this.container.classList.add(EditableInputField.cssHiddenClassName);
        this.container.classList.remove(EditableInputField.cssActiveClassName);
        this.container.append(textContainer);

        this.container.onclick = (e: MouseEvent) => { // Using onclick for simplicity, addEventListener is also fine
            e.preventDefault();
            if (!this.isactive) {
                this.activate();
            }
        };
    }

    private setupEventHandlers(editableInputFieldHTML: HTMLDivElement): void {
        this.dialogDOM.confirmButton.addEventListener("click", (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            this.callback.onConfirm(this);
            this.deactivate();
        });
        this.dialogDOM.cancelButton.addEventListener("click", (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            this.deactivate();
        });
        // Limit character amount
        if (this.limit > 0 && this.quill) {
            this.quill.on('text-change', (delta, oldDelta, source) => {
                if (this.quill && this.quill.getLength() > this.limit) {
                    this.quill.deleteText(this.limit, this.quill.getLength());
                }
            });
        }
    }

    public activate(): false | void {
        if (this.readOnly) return false;
        this.isactive = true;
        this.container.classList.remove(EditableInputField.cssHiddenClassName);
        this.container.classList.add(EditableInputField.cssActiveClassName);
        this.container.innerHTML = "";
        this.container.append(this.quillcontainer);
        // Build dialog buttons
        const buttons = this.buildHTML();
        // Append to container
        this.container.append(buttons);
        this.setupEventHandlers(buttons);
        this.container.onclick = null; // Remove the click listener that activates the editor
    }

    public isActive(): boolean {
        return this.isactive;
    }

    public getQuill(): Quill | undefined {
        return this.quill;
    }

    public getHtmlContent(): string {
        return this.quill ? this.quill.getSemanticHTML() : '';
    }

    public reset(
        container: HTMLElement,
        deltaContent: Delta,
        type: string,
        callback: EditableInputFieldCallbacks,
        { active, disableButtons, readOnly, limit }: EditableInputFieldArgs
    ): EditableInputField {
        return new EditableInputField(container, deltaContent, type, callback, { active, disableButtons, readOnly, limit });
    }
}