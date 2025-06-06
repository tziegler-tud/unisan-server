import {MDCTextField} from '@material/textfield';
import {Preloader} from "./helpers/preloader.js";

import "./common.scss";
import "./pushhandler";

document.addEventListener("DOMContentLoaded", function(event) {
    console.log("js active, removing noscript fallback");
    document.body.classList.remove("no-js");

    try {
        const textField = new MDCTextField(document.querySelector('#mdcTextField1'));
        const textField2 = new MDCTextField(document.querySelector('#mdcTextField2'));
    }
    catch(e){
        console.log("Failed to initialize login text fields.")
    }

    //redirect button for logout page
    document.querySelectorAll(".redirect-button").forEach(button => {
        const url = button.dataset.redirect;
        if(url) {
            button.addEventListener("click", ()=>{
                window.location = url;
            })
        }
    })

    const privacy = document.querySelector(".privacy-accept-form");
    if(privacy){
        let accBtn = privacy.querySelector(".button-privacyAccept");
        let decBtn = privacy.querySelector(".button-privacyDecline");

        if(accBtn) accBtn.addEventListener("click", function(){
            window.location = "/acceptPrivacyAgreement"
        })
        if(decBtn) decBtn.addEventListener("click", function(){
            window.location = "/declinePrivacyAgreement"
        })
    }


});

window.onload = function() {
    console.log("finished loading, hiding preloader");
    var plr = new Preloader();
    setTimeout(plr.hide,0);
};