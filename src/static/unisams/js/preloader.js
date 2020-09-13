(function (common, undefined, undefined) {

    /**
     * @namespace: common
     */
    common.preloader = function(){
        var plr = {};
        var self = document.getElementById("preloader");

        plr.hide = function(){
            self.classList.remove("preloader-active");
            self.classList.add("preloader-hidden");
        };
        return plr;
    };
    return common;

}(window.common = window.common||{}, undefined, undefined));