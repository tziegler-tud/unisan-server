import {MDCTextField} from '@material/textfield';

document.addEventListener("DOMContentLoaded", function(event) {
    console.log("js active, removing noscript fallback");
    document.body.classList.remove("no-js");

    const textField = new MDCTextField(document.querySelector('#mdcTextField1'));
    const textField2 = new MDCTextField(document.querySelector('#mdcTextField2'));




});

window.onload = function() {
    console.log("finished loading, hiding preloader");
    var plr = common.preloader();
    setTimeout(plr.hide,0);
};