/**
 *
 * lidl default navigation v1.0
 *
 * Setup:
 *  //TODO: add setup instructions
 *
 *
 *
 *
 *
 *
 *
 *
 * @author: Tom Ziegler
 *
 *
 * @namespace lidl
 *
 *
 *************/

(function (lidl,$,undefined) {
    (function (nav,$,undefined) {

    /*imports*/
    var Hammer = window.Hammer;

    /*config variables*/
    var debug = false;



    /*private variables*/
    var navBarHeight = undefined;
    var didScroll = false;
    var lastScrollTop = 0;

    var interval;
    var mc;

    /*scrollevent delay*/
    var waiting = false;
    var delay = 100;


    /*enums*/
    var componentEnum = {
        NAVBAR: 0,
        MENU:   1
    };


    /*public variables*/
    var navBar = null;
    var menu = null;

    /*public functions*/




    /**
     * Constructor for Nav object. Call with 'new' keyword.
     *
     * @param {string} token lidl object token.
     * @param {string} domId unique ID used to reference the navigation container in the DOM Tree.
     * @param {string} domIdNavBar unique ID used to reference the header bar in the DOM Tree.
     * @param {string} domIdMenu unique ID used to reference the menu in the DOM Tree.
     *
     * @returns {object} instance of the created object.
     *
     * @class
     * @constructor
     */

    nav.Nav = function(token, domId, domIdNavBar, domIdMenu){
        var self = this;
        this.ref = document.getElementById(domId);
        navBar = addComponent(domIdNavBar,componentEnum.NAVBAR);
        menu = addComponent(domIdMenu,componentEnum.MENU);
        this.token = token;
        //mc = setupMc();

        navBarHeight = navBar.getHeight();

        lidl.assertHTMLElement(this.ref,debug);

        adjust_menu(); //fails if called before dom loaded, but in that case gets called by event handler later on.
        $(window).on('load',function() {
            adjust_menu();
        });
        $(window).on('resize',function() {
            adjust_menu();
        });
        window.addEventListener('scroll', function() {
            if (waiting) {
                return;
            }
            waiting = true;
            if(!menu.getState()){
                hasScrolled();
            }
            setTimeout(function () {
                waiting = false;
            }, delay);
        });

        this.getNavBar = function(){
            return navBar;
        };
        this.getMenu = function(){
            return menu;
        };

        document.getElementById("hamburger").addEventListener("click", function() {
            this.classList.toggle("is-active");
            toggleMenu();
        }, false);
    };

    var toggleMenu = function(){
        menu.toggle();
    };

    var adjust_menu = function(){
            $(menu.ref).css({
                "height": window.innerHeight - navBarHeight + 'px'
            });
            lidl.debug("console.log('setting menu height to '"+ window.innerHeight +"- " + navBarHeight,lidl.debugCategory.RESIZE);
        };

    var hasScrolled = function(){
        var delta = 100;
        var thresh = 3*navBar.getHeight();
        var scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;

        if(scrollTop < thresh){
            navBar.setState(true);
        }
        if(Math.abs(scrollTop - lastScrollTop) < delta)//did not scroll
        {
            lidl.debug('console.log("did not scroll")',lidl.debugCategory.SCROLL);
            return;
        }
        else{
            if(scrollTop > lastScrollTop && scrollTop > thresh) //scrolled down > thresh
            {
                lidl.debug('console.log("scroll down")',lidl.debugCategory.SCROLL);
                navBar.setState(false);
            }
            else { //scrolled up or < thresh
                lidl.debug('console.log("scroll up")',lidl.debugCategory.SCROLL);
                navBar.setState(true);
            }
        }

        lastScrollTop = scrollTop;
    };

    var addComponent = function(domId,componentEnum){
        var component;
        var createComponent;
        switch(componentEnum){
            case 0:
                component = navBar;
                createComponent  = "nav.navComponent.navBar.NavBar";


                break;
            case 1:
                component = menu;
                createComponent  = "nav.navComponent.menu.Menu";


                break;
        }
        if (component!=null && component.isUnique) {
            throw new Error("Object instance already assigned: An instance of the target class has already been assigned and carries the isUnique flag.")
        }
        else {
            return eval("new "+ createComponent + "('" + domId + "')");
        }
    };

    return nav;


    }(lidl.nav = window.lidl.nav || {}, jQuery));

}(lidl = window.lidl || {},jQuery));