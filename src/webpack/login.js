import {MDCTextField} from '@material/textfield';
import {Preloader} from "./helpers/preloader.js";

import "./common.scss";

document.addEventListener("DOMContentLoaded", function(event) {
    console.log("js active, removing noscript fallback");
    document.body.classList.remove("no-js");

    const textField = new MDCTextField(document.querySelector('#mdcTextField1'));
    const textField2 = new MDCTextField(document.querySelector('#mdcTextField2'));




});

window.onload = function() {
    console.log("finished loading, hiding preloader");
    var plr = new Preloader();
    setTimeout(plr.hide,0);
};