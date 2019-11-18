(function (nav,$,undefined) {

    /*imports*/
    var lidl = window.lidl;
    var Hammer = window.Hammer;

    /*config variables*/
    var debug = false;
    lidl.addDebugCategory(lidl.debugCategory.SCROLL);


    /*private variables*/
    var navBarHeight = undefined;
    var didScroll = false;
    var lastScrollTop = 0;

    /**
     * Constructor for Nav object
     *
     * @param navBarDomId {string} Id of the DOM Object representing the header bar.
     * @param menuDomId {string} Id of the DOM Object representing the menu.
     *
     *
     * @class
     * @constructor
     */

    nav.Nav = function(navBarDomId, menuDomId) {
        this.navBarDom = document.getElementById(navBarDomId);
        this.menuDom = document.getElementById(menuDomId);
        try {
            lidl.assertHTMLElement(this.navBarDom, debug);
            lidl.assertHTMLElement(this.menuDom, debug);
        } catch (e) {
            console.error("Failed to initialize DOM frame: " + e);
        }

        var navBarHeight = this.navBarDom.clientHeight;

        init();
    };

    nav.Nav.prototype.writeNavBarCss = function(){
        $(this.menuDom).css({
            "height": window.innerHeight - navBarHeight + 'px'
        });
    };

    nav.Nav.prototype.getNavBarHeight = function(){
        return navBarHeight;
    };

    /**
     * NavObject.
     *
     * @abstract
     *
     *
     * @param domId
     * @constructor
     */

    nav.NavObject = function(domId,isUnique,defaultState){
        /*error if called directly*/
        if (this.constructor === nav.NavObject) {
            throw new Error('Cannot instanciate abstract class.');
        }


        /*public attributes*/
        this.ref = document.getElementById(domId);
        this.isUnique = isUnique;

        /*private attributes*/
        var state = defaultState;


        /*test ref for validity */
        try{
            lidl.assertHTMLElement(this.ref,debug);
        }
        catch(e){
            throw new Error("Failed to initialize DOM Element with Id: " + domId +" with error: "+ e);
        }

        /*public methods*/
        this.getState = function(){
            return state;
        };

        this.setState = function(newstate){
            if (newstate) {
                this.activate()
            }
            else {
                this.deactivate();
            }
            state = newstate;
            return state;
        };
    };
    nav.NavObject.prototype.activate = function(){
        throw new Error('Cannot call abstract method');
    };
    nav.NavObject.prototype.deactivate = function(){
        throw new Error('Cannot call abstract method');
    };




    /**
     * Navbar constructor. You may only have one object of that type.
     *
     * @extends NavObject
     *
     * @constructor
     */

    nav.NavBar = function(domId){
        nav.NavObject.call(this, domId,true,true);
    };
    nav.NavBar.prototype = Object.create(nav.NavObject.prototype, {
        'constructor': nav.NavBar
    });
    nav.NavBar.prototype.activate = function () {
        this.ref.classList.add("nav-active");
    };
    nav.NavBar.prototype.deactivate = function () {
        this.ref.classList.remove("nav-active");
    };




    /**
     * Menu constructor. You may only have one object of that type.
     *
     * @extends NavObject
     *
     * @constructor
     */

    nav.Menu = function(){
        nav.NavObject.apply(this, arguments);
    };
    nav.Menu.prototype = Object.create(nav.NavObject.prototype, {
        'constructor': nav.Menu
    });


    var setupMc = function() {
        var mc = new Hammer.Manager(this.navBarDom);
        mc.add(new Hammer.Pan({direction: Hammer.DIRECTION_DOWN, threshold: 0}));
        mc.on("pan", function () {

        });

        return mc;
    };

    var init = function (){

        /*toggle navbar view on scrolling*/
        setInterval(function() {
            if(MenuStateModule.getState()){
                didScroll=false;
            }
            else{
                if (didScroll) {
                    hasScrolled();
                    didScroll = false;
                }
            }
        }, 500);


        return true;


    };


    /* private modules */

    var NavBarStateModule = (function(){
        var state = true;
        var navBarState = {};
        var navStatic = null;

        navBarState.setState = function (newstate) { //false = hidden
            if(navStatic == null){
                navStatic = document.getElementById("nav-static");
            }

            if (newstate) {
                showBar();
            }
            else {
                hideBar();
            }
            state = newstate;
        };
        navBarState.getState = function () {
            return state;
        };

        var hideBar = function () {
            navStatic.classList.remove("nav-hidden");
        };

        var showBar = function (){
            navStatic.classList.add("nav-hidden");
        };
        return navBarState;
    }());

    var MenuStateModule = (function(){
        var state = false;
        var menuState = {};

        menuState.setState = function (newstate) { //false = hidden

            if (newstate) {
                menuDom.classList.add("menu-active");

            }
            else {
                menuDom.classList.remove("menu-active");

            }
            state = newstate;
            return state;
        };
        menuState.getState = function () {
            return state;
        };

        menuState.toggle = function(){
            return this.setState(!state);
        };
        return menuState;
    }());


    function hasScrolled(){
        var delta = 100;
        var scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;

        if(Math.abs(scrollTop - lastScrollTop) < delta)//did not scroll
        {
           lidl.debug('console.log("did not scroll")',lidl.debugCategory.SCROLL);
            return;
        }
        if(scrollTop - lastScrollTop > delta && scrollTop > navBarHeight) //scrolled down > navBarHeight
        {
            lidl.debug('console.log("scroll down")',lidl.debugCategory.SCROLL);
            NavBarStateModule.setState(true);
        }
        else { //scrolled up or <navBarHeight
            lidl.debug('console.log("scroll up")',lidl.debugCategory.SCROLL);
            NavBarStateModule.setState(false);
        }

        lastScrollTop = scrollTop;
    }




    nav.toggle = function(){
        MenuStateModule.toggle();
    };


    nav.scrollEvent = function (){
        didScroll = true;
    };



    return nav;


}(nav = window.nav || {}, jQuery));