
fixEnabled = false;

var phone = window.matchMedia("only screen and (max-width: 50em)");

if (!phone.matches) { // If media query matches
    fixEnabled = false;
    floatingButtonContextId = "wrapper";
    scrollContainerRefId = "wrapper";
    jmpTopBtnId = "btn-jmptop-ext";
}


