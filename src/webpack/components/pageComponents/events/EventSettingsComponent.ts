import Component, {ComponentOptions} from "../../Component";
import ComponentPage from "../../ComponentPage";
import Searchbar from "../../../widgets/searchbar/SearchBar";
import ComponentObserver from "../../ComponentObserver";
import InteractiveListStandaloneComponent from "../../interactiveListStandalone";

import { escapeRegExp } from "../../../helpers/helpers";

import {IAugmentedPosting, IEvent, IPosition, IPosting, IPostingAllowed} from "../../../types/Event";
import EventProfile from "../../../events/EventProfile";
import eventActions from "../../../actions/eventActions";
import {IUser} from "../../../types/User";


import {getTemplate} from "../../../utils/utils";



interface InteractionConfig {
    type: string;
    identifier: string;
    valueFunc: (entry: ListEntry) => any;
    config?: { classes?: string[] };
    params?: Record<string, any>;
}

interface InteractiveListConfig {
    entryLabel: (entry: ListEntry) => string;
}

interface InteractiveListData {
    listEntries: ListEntry[];
    interactions: InteractionConfig[];
}

interface EventSettingsData {

}

export default class EventSettingsComponent extends Component {
    templateUrl: string;
    page: ComponentPage;
    data: EventSettingsData;
    container!: HTMLElement;
    _deleteEventButton!: HTMLElement;

    constructor({ page, section, componentId, pageData = {}, data = {}, args = {} }: ComponentOptions) {
        super({ page, section, componentId, pageData, data, args });
        this.templateUrl = "/webpack/components/templates/system/eventSettings.hbs";
        this.page = page!;
        this.data = data;
    }

    async postRender(): Promise<void> {
        const self = this;

        const registrationSwitchesContainer = this.container.querySelector(".eventSettings-registration--switches") as HTMLElement;
        this._deleteEventButton = document.getElementById("deleteEventButton") as HTMLButtonElement;




        const registrationSwitchesEntries: ListEntry[] = [
            {
                label: "Email-Accounts automatisch anlegen",
                value: self.data.createAccountOnUserCreation,
                identifier: "list-entry--createAccount",
            },
            {
                label: "Email-Accounts automatisch entfernen",
                value: self.data.deleteAccountOnUserDeletion,
                identifier: "list-entry--deleteAccount",
            },
        ];

        const registrationSwitchesConfig: InteractionConfig = {
            type: "switch",
            identifier: "switch-accountCreation-enabled",
            valueFunc: (entry) => entry.value,
        };

        const registrationSwitchesData: InteractiveListData = {
            listEntries: switchSettingsEntries,
            interactions: [switchSettingsSwitch],
        };

        const switchSettingsConfig: InteractiveListConfig = {
            entryLabel: (entry) => entry.label,
        };

        const switchSettingsList = new InteractiveListStandaloneComponent({
            element: registrationSwitchesContainer,
            config: registrationSwitchesConfig,
            data: registrationSwitchesData,
        });
        switchSettingsList.render();

        const switchSettingsObserver = new ComponentObserver((event: string, data: any) => {
            if (event === "changed") {
                const updateData = {
                    createAccountOnUserCreation: self.data.createAccountOnUserCreation,
                    deleteAccountOnUserDeletion: self.data.deleteAccountOnUserDeletion,
                };
                switch (data.entry.identifier) {
                    case "list-entry--deleteAccount":
                        updateData.deleteAccountOnUserDeletion = data.value;
                        break;
                    case "list-entry--createAccount":
                        updateData.createAccountOnUserCreation = data.value;
                        break;
                    default:
                        return;
                }
                systemActions.updateMailSettings(updateData).then(() => {
                    updateStatus();
                    self.page.snackbar?.show("Mail Service gestartet.");
                });
            }
        });
        switchSettingsList.addObserver(switchSettingsObserver);

        /** ------------------ SERVER SETTINGS INPUT ------------------ */
        const settingsInput: InteractionConfig = {
            type: "input",
            identifier: "input-service-data",
            valueFunc: (entry) => entry.value,
            params: { disabled: false, readonly: true },
        };

        const createSettingEntries = (): ListEntry[] => [
            { label: "Mailserver URL", value: self.data.url },
            { label: "Mailserver API port", value: self.data.port },
            { label: "Mailserver API Path", value: self.data.baseUrl },
            { label: "Mailserver API Key", value: self.data.apiKey },
            { label: "Mailserver domain", value: self.data.domain },
        ];

        const settingsData: InteractiveListData = {
            listEntries: createSettingEntries(),
            interactions: [settingsInput],
        };

        const settingsConfig: InteractiveListConfig = {
            entryLabel: (entry) => entry.label,
        };

        const settingsList = new InteractiveListStandaloneComponent({
            element: serverSettingsContainer,
            config: settingsConfig,
            data: settingsData,
        });
        settingsList.render();

        const settingsObserver = new ComponentObserver((event: string) => {
            if (event === "click") {
                if (this.page.sidebar) {
                    this.page.sidebar.addContent("mailSettings", {
                        title: "Mail Settings",
                        data: { ...this.data },
                        callback: {
                            onConfirm: (data: MailSettingsData) => {
                                systemActions
                                    .updateMailSettings(data)
                                    .then(() => systemActions.restartMailService())
                                    .then(() => {
                                        Object.assign(this.data, data);
                                        settingsList.setListEntries(createSettingEntries());
                                        settingsList.render();
                                        this.page.sidebar.hide();
                                        this.page.snackbar?.show("Mail Service neu gestartet.");
                                    });
                            },
                        },
                    });
                    this.page.sidebar.show();
                } else {
                    this.page.snackbar?.showCustomError?.("Sidebar konnte nicht geladen werden.", "Error");
                }
            }
        });
        settingsList.addObserver(settingsObserver);

        /** ------------------ ACCOUNT SETTINGS ------------------ */
        const accountInput: InteractionConfig = {
            type: "input",
            identifier: "input-service-data",
            valueFunc: (entry) => entry.value,
            params: { disabled: false, readonly: true },
        };

        const createAccountEntries = (): ListEntry[] => [
            { label: "System mail address", value: self.data.systemMailAccount ?? "" },
            { label: "Account token", value: self.data.systemMailAccountToken ?? "" },
        ];

        const accountData: InteractiveListData = {
            listEntries: createAccountEntries(),
            interactions: [accountInput],
        };

        const accountConfig: InteractiveListConfig = {
            entryLabel: (entry) => entry.label,
        };

        const accountList = new InteractiveListStandaloneComponent({
            element: accountContainer,
            config: accountConfig,
            data: accountData,
        });
        accountList.render();

        const accountObserver = new ComponentObserver((event: string) => {
            if (event === "click") {
                if (this.page.sidebar) {
                    this.page.sidebar.addContent("mailSystemAccountSettings", {
                        title: "System Mail Account Settings",
                        data: { systemMailAccount: this.data.systemMailAccount },
                        callback: {
                            onConfirm: (data: { systemMailAccount: string }) => {
                                systemActions
                                    .updateMailSettings({ systemMailAccount: data.systemMailAccount })
                                    .then(() => systemActions.restartMailService())
                                    .then(() => {
                                        this.data.systemMailAccount = data.systemMailAccount;
                                        accountList.setListEntries(createAccountEntries());
                                        accountList.render();
                                        this.page.sidebar.hide();
                                        this.page.snackbar?.show("Mail Service neu gestartet.");
                                    });
                            },
                        },
                    });
                    this.page.sidebar.show();
                } else {
                    this.page.snackbar?.showCustomError?.("Sidebar konnte nicht geladen werden.", "Error");
                }
            }
        });
        accountList.addObserver(accountObserver);

        /** ------------------ ACCOUNT BUTTONS ------------------ */
        checkAccountExistsButton.addEventListener("click", () => {
            if (!this.data.systemMailAccount) {
                this.page.snackbar?.showCustomError?.("Cannot check account: system mail account is undefined.", "");
                return;
            }

            const domainEscaped = escapeRegExp(self.data.domain ?? "");
            const checker = new RegExp(`^[a-zA-Z0-9]\\w+@${domainEscaped}$`);
            if (!checker.test(this.data.systemMailAccount)) {
                this.page.snackbar?.showCustomError?.("Cannot check account: system mail account is not a valid email address.", "");
                return;
            }

            systemActions
                .checkMailAccountExists(this.data.systemMailAccount)
                .then((response: any) => {
                    this._enableSyncTokenButton();
                    this.page.snackbar?.show(`Account ${this.data.systemMailAccount} exists!`);
                })
                .catch(() => {
                    this._enableCreateAccountButton();
                    this.page.snackbar?.show(`No account available for email ${this.data.systemMailAccount}`);
                });
        });

        this._createAccountButton.addEventListener("click", () => {
            if (!this._createAccountButtonEnabled) return;
            if (!this.data.systemMailAccount) {
                this.page.snackbar?.showCustomError?.("Cannot check account: system mail account is undefined.", "");
                return;
            }

            systemActions
                .createSystemMailAccount(this.data.systemMailAccount)
                .then((response: any) => {
                    this.page.snackbar?.show(`Account created successfully. Email: ${response.body.email}`);
                })
                .catch((err: any) => {
                    this.page.snackbar?.showCustomError?.(String(err), "Error");
                });
        });

        this._syncTokenButton.addEventListener("click", () => {
            if (!this._syncTokenButtonEnabled) return;
            if (!this.data.systemMailAccount) {
                this.page.snackbar?.showCustomError?.("Cannot check account: system mail account address is undefined.", "");
                return;
            }

            systemActions
                .recreateSystemMailAccountToken()
                .then((response: any) => {
                    this.page.snackbar?.show(`New token obtained successfully: ${response.body.email}`);
                })
                .catch((err: any) => {
                    this.page.snackbar?.showCustomError?.(String(err), "Error");
                });
        });
    }

    private _disableCreateAccountButton(): void {
        this._createAccountButtonEnabled = false;
        this._createAccountButton.classList.add("content-link--disabled");
    }

    private _enableCreateAccountButton(): void {
        this._createAccountButtonEnabled = true;
        this._createAccountButton.classList.remove("content-link--disabled");
    }

    private _disableSyncTokenButton(): void {
        this._syncTokenButtonEnabled = false;
        this._syncTokenButton.classList.add("content-link--disabled");
    }

    private _enableSyncTokenButton(): void {
        this._syncTokenButtonEnabled = true;
        this._syncTokenButton.classList.remove("content-link--disabled");
    }

    getHtml(): string {
        return (this as any).html;
    }
}
