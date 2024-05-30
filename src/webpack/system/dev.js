import {systemActions} from "../actions/systemActions";
import {Snackbar} from "../helpers/snackbar";

let dev = {
    init: function () {
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: system.dev");

            window.snackbar = new Snackbar();

            //rebuild acl button
            const aclRebuildButton = document.getElementById("button-rebuildAcl");
            aclRebuildButton.addEventListener("click", function(){
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
        })
    }
};

export {dev}