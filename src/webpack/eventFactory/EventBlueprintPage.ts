// factory for building html elements related to event pages
import { EditableTextField } from "../helpers/editableTextField";
import Handlebars from "handlebars";
import * as FilePond from "filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginGetFile from "filepond-plugin-get-file";
import { MDCList } from "@material/list";
import { MDCRipple } from "@material/ripple";
import { MDCMenu } from "@material/menu";
import { transformToLocalizedDateString } from "../helpers/helpers";
import eventBlueprintActions from "../actions/eventBlueprintActions";
import Sidebar from "../sidebar/Sidebar";

interface EventBlueprintPageArgs {
    container: HTMLElement | null;
    data: any;
    sidebar?: Sidebar | null;
    args?: Record<string, unknown>;
}

interface ComponentArgs {
    allowEdit?: boolean;
    size?: 'full' | 'half';
    classes?: string;
    order?: number;
    handlers?: ((component: Component) => void)[];
}

export default class EventBlueprintPage {
    static eventTypes = {
        eventTraining: "1",
        eventSeminar: "2",
        eventSan: "3",
        other: "0",
    };

    static componentTypes = {
        DESCRIPTION: "1",
        DATE: "2",
        LOCATION: "3",
        FILES: "4",
        PARTICIPANTS: "5",
        POSTINGS: "6",
        GENERIC: "0",
    };

    private componentCounter = {
        current: 0,
        next: () => ++this.componentCounter.current,
    };

    public data: any;
    public container: HTMLElement | null;
    public sidebar: Sidebar | null | undefined;
    public components: Component[] = [];
    private componentContainer: HTMLElement | null;
    public event: any;

    constructor(args: Partial<EventBlueprintPageArgs> = {}) {
        const defaults: EventBlueprintPageArgs = {
            container: null,
            data: {},
            sidebar: null,
            args: {},
        };

        const mergedArgs = Object.assign({}, defaults, args);

        this.data = mergedArgs.data;
        this.container = mergedArgs.container;
        this.sidebar = mergedArgs.sidebar;
        this.event = this.data.event ?? {};
        this.componentContainer = this.container;
    }

    addComponent(componentType: string, args: ComponentArgs = {}) {
        const componentId = this.componentCounter.next();
        const component = new Component(componentId, componentType, this.data, args);
        this.components.push(component);
        this.componentContainer?.appendChild(component.getHtml());
    }
}

class Component {
    public container: HTMLDivElement;
    public html: HTMLElement;
    public componentId: number;
    private args: Required<ComponentArgs>;

    constructor(componentId: number, componentType: string, data: any, args: ComponentArgs = {}) {
        const defaults: Required<ComponentArgs> = {
            allowEdit: true,
            size: "full",
            classes: "",
            order: componentId,
            handlers: [],
        };

        this.args = Object.assign({}, defaults, args);
        this.componentId = componentId;
        this.container = document.createElement("div");
        this.container.classList.add("eventPage-component-wrapper");
        if (this.args.size === "full") {
            this.container.classList.add("eventPage-component-wrapper--full");
        } else if (this.args.size === "half") {
            this.container.classList.add("eventPage-component-wrapper--half");
        }
        this.container.style.order = String(this.args.order);
        this.html = this.container;

        this.init(componentType, data);
    }

    private async init(componentType: string, data: any): Promise<void> {
        const self = this;
        let templateUrl = "";
        let handleData = { ...data };

        handleData.args = {
            allowEdit: self.args.allowEdit,
            displayLocalizedDate: false,
        };

        handleData.userAgent = {
            locale: Intl.DateTimeFormat().resolvedOptions(),
        };

        switch (componentType) {
            case EventBlueprintPage.componentTypes.DESCRIPTION:
                templateUrl = "/webpack/eventFactory/pageModules/eventDescription.hbs";
                const descriptionTemplateData = await $.get(templateUrl);
                const descriptionTemplate = Handlebars.compile(descriptionTemplateData);
                self.container.innerHTML = descriptionTemplate(handleData);

                if (self.args.allowEdit) {
                    const editableTextFieldContainer = self.container.querySelector(".eventDescriptionEditor") as HTMLElement;
                    const callback = {
                        onConfirm: (editableTextField: EditableTextField) => {
                            const event = data.event;
                            const newData = {
                                shortDesc: {},
                                longDesc: {
                                    value: editableTextField.getQuill().getText(),
                                    delta: editableTextField.getQuill().getContents(),
                                },
                            };
                            eventBlueprintActions.saveDescription(event.id, newData, {
                                onSuccess: (result: any) => {
                                    editableTextField.reset(
                                        editableTextFieldContainer,
                                        result.description.longDesc.delta,
                                        result.description.longDesc.html,
                                        callback,
                                        {}
                                    );
                                },
                            });
                        },
                    };

                    new EditableTextField(
                        editableTextFieldContainer,
                        data.event.description.longDesc.delta,
                        data.event.description.longDesc.html,
                        callback,
                        { readOnly: !self.args.allowEdit }
                    );
                }

                self.args.handlers.forEach((handler) => handler(self));
                break;

            case EventBlueprintPage.componentTypes.DATE:
                templateUrl = "/webpack/eventFactory/pageModules/eventDate.hbs";
                const localLangIdentifier = "de-DE";
                const localTimeZone = "Europe/Berlin";
                let displayLocalizedDate = false;

                const userTz = handleData.userAgent.locale.timeZone;
                if (userTz && userTz !== localTimeZone) {
                    displayLocalizedDate = true;
                    handleData.localizedDate = {
                        timezone: localTimeZone,
                        startDate: transformToLocalizedDateString(data.event.date.startDate, localLangIdentifier, localTimeZone),
                        endDate: transformToLocalizedDateString(data.event.date.endDate, localLangIdentifier, localTimeZone),
                    };
                }

                const dateTemplateData = await $.get(templateUrl);
                const dateTemplate = Handlebars.compile(dateTemplateData);
                handleData.args.displayLocalizedDate = displayLocalizedDate;
                self.container.innerHTML = dateTemplate(handleData);

                self.args.handlers.forEach((handler) => handler(self));
                break;

            case EventBlueprintPage.componentTypes.LOCATION:
                // Placeholder
                break;

            case EventBlueprintPage.componentTypes.POSTINGS:
                // Placeholder
                break;

            case EventBlueprintPage.componentTypes.GENERIC:
                // Placeholder
                break;
        }
    }

    public getHtml(): HTMLElement {
        return this.html;
    }
}
