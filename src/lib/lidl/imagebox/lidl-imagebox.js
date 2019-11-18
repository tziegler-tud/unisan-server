/**
 *
 * imagebox
 *
 * Setup:
 *  <div class="imagebox">
 *      <div class=imagebox-container">
 *          <div class="imagebox-image"><img src=... ><label>...</label></div>
 *      </div>
 *  </div>
 *
 *
 *
 *
 *
 *
 *
 *
 * @author: Tom Ziegler
 * @version: 0.1b
 *
 *
 * @namespace lidl
 *
 *
 *************/



(function (lidl,$,undefined) {

    /**
     *
     * Constructor of imagebox object
     *
     * @param imageboxDomId {string} HTML DOM Object Id of the imagebox wrapper div
     * @param token {string} lidl object token
     * @param optionalStartIndex {int} [0] Index of slide to display on startup.
     * @param optionalImagePath {string} ['images/imagebox'] Path to draw images from. Defaults to 'images/imagebox'.
     * @param optionalLayout {int} [0] choose Layout. Defaults to 0.
     * @param optionalDisableDefaultStyling {boolean} [false] Disable default css styling to apply custom styling. False if unset.
     *
     * @class
     * @constructor
     *
     */

    lidl.Imagebox = function (imageboxDomId, token, optionalStartIndex, optionalImagePath, optionalLayout, optionalDisableDefaultStyling) {


        var startIndex = (typeof optionalStartIndex === 'undefined') ? 0 : optionalStartIndex;
        this.imageDirPath = (typeof optionalImagePath === 'undefined') ? 'images/imagebox' : optionalImagePath;
        this.layout = (typeof optionalLayout === 'undefined') ? 0 : optionalLayout;
        this.defaultStyling = (typeof optionalDisableDefaultStyling === 'undefined') ? false : optionalDisableDefaultStyling;

        console.log('creating imagebox...');

        var self = this;

        this.token = token;

        this.currentImageIndex = startIndex;

        this.images = [];

        this.currentImage = null;

        this.parent = document.getElementById(imageboxDomId);
        this.container = document.getElementById(imageboxDomId + "-slider");

        this.navigationDotsEnbaled = false;





        var imagesArray = $(this.parent).find('.lidl-imagebox-image');

        imagesArray.each(function () {
            self.addImage(this);

        });
        console.log("Number of images: " + this.images.length);


        switch(this.layout){
            default:

            case 0:
                //navigation at bottom
                this.navigation = this.createNavigationBottom();
                this.container.classList.add("navigation-bottom");
                this.navigationDotsEnbaled = true;
                //this.calcDimensions();
                break;
            case 1:
                //navigation on right side
                this.navigation = this.createNavigationSide(0);
                this.parent.classList.add("navigation-right");
                this.navigationDotsEnbaled = true;
                break;
            case 2:
                //navigation on left side
                this.navigation = this.createNavigationSide(1);
                this.parent.classList.add("navigation-left");
                this.navigationDotsEnbaled = true;
                break;

            case 3:
                //navigational arrows
                this.navigation = this.createNavigationArrows();
                this.parent.classList.add("navigation-arrows");
                break;

            case 4:
                //no navigation
                this.navigation = undefined;

        }

        if(!this.defaultStyling){
            this.parent.classList.add("style-default");
        }

        //this.createNavigationBottom();
        this.showImage(startIndex);
        return this;

    };


    /**
     *
     * Displays the given Image.
     *
     * Throws RangeError if given index is not available.
     *
     * @param {object} imgIndex ID of Image to display
     * @returns {boolean} true if succesfull, false if failed.
     */

    lidl.Imagebox.prototype.showImage = function (imgIndex) //Index of next image to display
    {


        var img = this.images[imgIndex];
        if (img === undefined) {
            throw new RangeError();
        }



        else {
            $(this.container).css({
                'transform': 'translateX(-'+ imgIndex * 33.3 +'%)'
            });

            if(this.navigationDotsEnbaled){this.setActiveNavDot(this.currentImageIndex, imgIndex);}
            this.currentImageIndex = parseInt(imgIndex);

            return true;
        }





        return false;


    };

    /**
     * displays the next image in order.
     *
     */

    lidl.Imagebox.prototype.nextImage = function(){
        try {
            this.showImage(this.currentImageIndex+1);
        }
        catch(err) {
            return;
        }

    };

    /**
     * displays the prev image in order.
     *
     */

    lidl.Imagebox.prototype.prevImage = function() {
        try {
            this.showImage(this.currentImageIndex-1);
        }
        catch (err) {
            return;
        }
    };

    /**
     * Highlights the navigation dot matching the currently displayed image. Removes highlighting from previously active dot.
     *
     * @param{int} oldIndex
     * @param{int} newIndex
     */

    lidl.Imagebox.prototype.setActiveNavDot = function(oldIndex, newIndex) {

        document.getElementById(this.token+'ClickMe'+oldIndex).classList.remove('nav-dot-active');
        document.getElementById(this.token+'ClickMe'+newIndex).classList.add('nav-dot-active');






    };

    /**
     *
     * Add images to the imagebox
     *
     * @param {array} img Jquery Object of image to be added.
     * @returns {number} total number of images in imagebox.
     *
     */
    lidl.Imagebox.prototype.addImage = function (img) {
        lidl.assert(img);
        return this.images.push(img);

    };

    lidl.Imagebox.prototype.calcDimensions = function () {
        var refSlide = $(this.images[0]);
        var height = refSlide.height() + 'px';
        var width  = refSlide.width() + 'px';

        this.height = height;
        this.width = width;

        $(this.container).css('height', height);


    };


    /**
     *
     * creates the navigation dots
     *
     */
    lidl.Imagebox.prototype.createNavigationBottom = function () {

        $(this.parent).append('<div id="'+this.token+'-nav" class="lidl-imagebox-nav nav-bottom"><div id="'+this.token +'-nav-label" class="lidl-imagebox-nav-label"></div></div>');

        var navLabel = document.getElementById(this.token + '-nav-label');

        var self = this;

        for (var i = 0; i < this.images.length; i++) {
            $(navLabel).append('<span id="'+this.token+'ClickMe'+i+'" data-imgindex="'+i+'" class="nav-dot"></span>');
            var dot = document.getElementById(this.token+"ClickMe"+i);
            dot.addEventListener("click", function() {

                self.showImage(this.dataset.imgindex);




            }, false);

        }

        $(navLabel).append('<div class="clear"></div>');
        var w = i*2;
        $(navLabel).css('width', w+'em');

        return document.getElementById(this.token + '-nav');
    };

    /*
    lidl.Imagebox.prototype.createNavigationSide = function (SideIdentifier) {
        //SideIndentifier: 0 -> right, 1 -> left

        if(SideIdentifier===0){
            $(this.parent).append('<div id="'+this.token+'-nav" class="lidl-imagebox-nav nav-right"><div id="'+this.token +'-nav-label" class="lidl-imagebox-nav-label"></div></div>');
        }
        else {
            $(this.parent).append('<div id="'+this.token+'-nav" class="lidl-imagebox-nav nav-left"><div id="'+this.token +'-nav-label" class="lidl-imagebox-nav-label"></div></div>');
        }
    }
    */

    lidl.Imagebox.prototype.createNavigationArrows= function () {

        const self = this;

        $(this.parent).append('<div id="'+this.token+'-nav" class="lidl-imagebox-nav nav-arrows"><div id="'+this.token +'-nav-label" class="lidl-imagebox-nav-label"></div></div>');

        var navLabel = document.getElementById(this.token + '-nav-label');
        //left arrow
        $(navLabel).append('<div id="'+this.token+'ClickMeL" class="nav-arrow left"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg></div>');
        const left = document.getElementById(this.token+"ClickMeL");
        left.addEventListener("click", function() {
            self.prevImage();
        }, false);

        //right arrow
        $(navLabel).append('<div id="'+this.token+'ClickMeR" class="nav-arrow right"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg></div>');
        const right = document.getElementById(this.token+"ClickMeR");
        right.addEventListener("click", function() {
            self.nextImage();
        }, false);

        return document.getElementById(this.token + '-nav');
    };


    /**
     *
     * returns the parent DOM Element
     *
     * @returns {Object} parent DOM element
     */
    lidl.Imagebox.prototype.getContainerDomElement = function (){
        return this.parent;
    };

    return lidl;
}
(lidl = window.lidl || {},jQuery));


