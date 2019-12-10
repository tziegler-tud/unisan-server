(function (common, $, undefined) {

    common.Menu = function(){
    };

    common.Menu.prototype.init = function(){

        if (typeof(window.activeDockerSection) !== 'undefined'){
            var activeElement = undefined;
            switch(window.activeDockerSection) {
                default:
                    break;
                case 'usermanagement':
                    activeElement = $("#usermanagement");
                    break;

                case 'dashboard':
                    activeElement = $("#dashboard");
                    break;

                case 'settings':
                    activeElement = $("#settings");
                    break;
            }
            if(activeElement.length){
                activeElement.addClass("docker-element-active");
            }
        }
    };
}(window.common = window.common || {}, jQuery));