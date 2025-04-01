import {systemActions} from "../actions/systemActions";
import {Snackbar} from "../helpers/snackbar";
import PageModule from "../utils/PageModule";

export default new PageModule({
    title: "system.development",
    pageData: {},
    init: async function (args) {
        window.snackbar = new Snackbar();

        //rebuild acl button
        const aclRebuildButton = document.getElementById("button-rebuildAcl");
        aclRebuildButton.addEventListener("click", function () {
            systemActions.rebuildAcl()
                .done(result => {
                    if (window.snackbar) {
                        window.snackbar.show("successfully rebuild docker acl objects.", {});
                    }
                })
                .fail(result => {
                    if (window.snackbar) {
                        let errJSON = result.responseJSON ?? {};
                        let message = errJSON.message ?? "Error";
                        window.snackbar.show("Failed to rebuild acl | " + "Error " + result.status + ": " + message, {
                            actionButton: {
                                display: true,
                                text: "Okay."
                            },
                            closeOnEscape: true,
                        });
                    }
                })
        })
    },
    buildPage: async function({args={}, data={}}={}) {
        const saveNewsButton = document.getElementById("button-updateNews");
        saveNewsButton.addEventListener("click", () => {
            systemActions.updateNewsTable()
                .done(result => {
                    if (window.snackbar) {
                        window.snackbar.show("successfully updated news documents.", {});
                    }
                })
                .fail(result => {
                    if (window.snackbar) {
                        let errJSON = result.responseJSON ?? {};
                        let message = errJSON.message ?? "Error";
                        window.snackbar.show("Failed to save news documents | " + "Error " + result.status + ": " + message, {
                            actionButton: {
                                display: true,
                                text: "Okay."
                            },
                            closeOnEscape: true,
                        });
                    }
                })
        })

        const saveEventsButton = document.getElementById("button-updateEvents");
        saveEventsButton.addEventListener("click", () => {
            systemActions.updateEventsTable()
                .done(result => {
                    if (window.snackbar) {
                        window.snackbar.show("successfully updated event documents.", {});
                    }
                })
                .fail(result => {
                    if (window.snackbar) {
                        let errJSON = result.responseJSON ?? {};
                        let message = errJSON.message ?? "Error";
                        window.snackbar.show("Failed to save events documents | " + "Error " + result.status + ": " + message, {
                            actionButton: {
                                display: true,
                                text: "Okay."
                            },
                            closeOnEscape: true,
                        });
                    }
                })
        })
    }
});
