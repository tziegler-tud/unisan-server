import "./preloader.scss"

var Preloader = function(){
    var plr = {};
    var self = document.getElementById("preloader");

    plr.hide = function(){
        self.classList.remove("preloader-active");
        self.classList.add("preloader-hidden");
    };
    plr.show = function(){
        self.classList.add("preloader-active");
        self.classList.remove("preloader-hidden");
    };
    return plr;
};

export {Preloader}