import Interaction from "./Interaction";

export interface ListEntry {
    label: string;
    value: string | number | boolean;
    identifier?: string;
    icon?: string;
    interactive?: boolean;
    disabled?: boolean;
}

export interface EntryInit {
    label: string;
    listEntry: ListEntry;
    icon: string;
    order: number;
    interactive: boolean;
    disabled: boolean;
}


export default class Entry {
    label: string;
    listEntry: ListEntry;
    icon: string;
    order: number;
    interactive: boolean;
    disabled: boolean;
    interactions?: Interaction[];

    constructor({ label, listEntry, icon, order, interactive, disabled }: EntryInit) {
        this.label = label;
        this.listEntry = listEntry;
        this.icon = icon;
        this.order = order;
        this.interactive = interactive;
        this.disabled = disabled;
    }

    setInteractions(interactions: Interaction[]): void {
        this.interactions = interactions;
    }
}