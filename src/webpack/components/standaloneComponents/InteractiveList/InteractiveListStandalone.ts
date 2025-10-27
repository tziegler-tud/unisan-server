// InteractiveListStandaloneComponent.ts

import StandaloneComponent from "../StandaloneComponent";
import Interaction, {InteractionConfig, InteractionTemplateData} from "./Interaction";
import Entry, {EntryInit, ListEntry} from "./Entry";
import ComponentObserver from "../../ComponentObserver";
import "./interactiveListStandalone.scss";
import Handlebars from "handlebars";
import { MDCSwitch } from "@material/switch";
import { MDCList } from "@material/list";
import { nanoid } from "nanoid";

// ---- InteractiveListStandaloneComponent ----

export default class InteractiveListStandaloneComponent extends StandaloneComponent {
    interactions: Interaction[];
    entries: Entry[];
    interactionData: InteractionConfig[];
    entryData: InteractionConfig[];
    identifierCounter: number;
    templateUrl: string;
    uid: string;

    constructor({
                    element,
                    config = {},
                    entries = [],
                    interactions = [],
                }: {
        element?: HTMLElement;
        config?: Record<string, any>;
        entries: ListEntry[];
        interactions: InteractionConfig[];
    }) {
        super({ name: "interactiveList", element, config, entries, interactions });
        const defaultLabelFunc = (entry: Entry) => entry.toString();

        this.config.entryLabel = this.config.entryLabel ?? defaultLabelFunc;
        this.interactionData = interactions;
        this.entryData = entries
        this.identifierCounter = 0;
        this.templateUrl = "/webpack/components/templates/standalone/interactiveList.hbs";
        this.uid = nanoid();

        if (this.container) {
            this.container.dataset.uid = this.uid;
        }

        this.config.defaultIcon = this.config.defaultIcon ?? "task_alt";
        this.config.disabled = this.config.disabled ?? false;
        this.config.interactive = this.config.interactive ?? true;

        this.interactions = [];
        this.entries = [];
    }

    async preRender(): Promise<void> {
        this.entries = [];
        this.interactions = [];

        const outerPromises = this.data.listEntries.map(async (listEntry, index) => {
            const entry = new Entry({
                label: this.config.entryLabel(listEntry),
                listEntry,
                icon: listEntry.icon ?? this.config.defaultIcon,
                order: index + 1,
                interactive: listEntry.interactive ?? this.config.interactive,
                disabled: listEntry.disabled ?? this.config.disabled,
            });
            this.entries.push(entry);

            for await (const interactionData of this.interactionData) {

            // this.interactionData.forEach((interactionData) => {
                const uid = this.getNewIdentifier(interactionData.type);
                const interaction = new Interaction({
                    type: interactionData.type,
                    uid: interactionData.uid,
                    identifier: interactionData.identifier,
                    valueFunc: interactionData.valueFunc,
                    params: interactionData.params,
                    interactive: interactionData.interactive,
                    disabled: interactionData.disabled,
                    defaultIcon: interactionData.defaultIcon,
                    additionalConfig: interactionData.additionalConfig,

                    value: interactionData.valueFunc(listEntry),
                    entry: listEntry,
                })
                await interaction.build();
                this.interactions.push(interaction);
            }
            entry.setInteractions(this.interactions);
        });

        await Promise.all(outerPromises);
        this.entries.sort((a, b) => a.order - b.order);
        this.data.entries = this.entries;
    }

    getNewIdentifier(prefix?: string): string {
        const prefixText = prefix ? `${prefix}-` : "";
        return `${this.uid}__${prefixText}${this.identifierCounter++}`;
    }

    async postRender(): Promise<void> {
        new MDCList(document.querySelector(".mdc-deprecated-list")!);
        this.interactions.forEach((interaction) => {
            if (interaction.connectDom()) {
                interaction.init();
                const observer = new ComponentObserver((event: string, data: any) =>
                    this.emitEvent({ event, data })
                );
                interaction.addObserver(observer);
            }
        });
    }

    getEntries(): Entry[] {
        return this.entries;
    }

    setListEntries(listEntries: ListEntry[]): void {
        this.data.listEntries = listEntries;
    }

    getListEntries(): ListEntry[] {
        return this.data.listEntries;
    }
}
