document.addEventListener("DOMContentLoaded", function(event) {
    console.log("js active, removing noscript fallback");
    document.body.classList.remove("no-js");

    const textField = new mdc.textfield.MDCTextField(document.querySelector('.mdc-text-field'));

});

window.onload = function() {
    console.log("finished loading, hiding preloader");
    var plr = common.preloader();
    setTimeout(plr.hide,0);
};






