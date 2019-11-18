/***************
 *
 * image slider
 *
 * Agreement:
 * When we talk about slides, we refer to the divs containing the slider images.
 * HTML Setup: Create div with id 'lidl-slider'.
 *
 *
 *
 *
 * @author: Tom Ziegler
 *
 *
 *************/



(function (lidl,$,undefined) {

    /**
     *
     * Constructor of slider object
     *
     * @param {boolean} showNavigation Enables or disables navigation arrows and dots
     * @param {boolean} autoslide Enables or disabled autmatic slide changes.
     * @param {number} slidingDelay Time in milliseconds, after which the next slide is displayed. Only if autoslide is set to true
     * @constructor
     *
     */

    lidl.Slider = function (showNavigation, autoslide, slidingDelay) {

        console.log('creating slider...');

        var self = this;

        this.showNavigation = showNavigation;
        this.autoslide = autoslide;
        this.delay = slidingDelay;
        this.slideAnimation = 'slide'; //blur or slide

        this.imgDirPath = 'images/slider';


        this.currentSlideIndex = 0;

        this.interval = null;
        this.slides = [];

        this.currentSlide = null;

        this.parent = document.getElementById('lidl-slider');
        this.navigation = document.getElementById('slider-nav');


        var slidesArray = $('.slider-image');

        slidesArray.each(function () {
            self.addSlide(this);
            self.setTransitionClass(this);
        });
        console.log("Number of slides: " + this.slides.length);


        this.createNavigation();
        this.calcDimensions();

        if (this.autoslide) {
            this.start()
        }


        return this;

    };

    /**
     *
     * Finds and displays the next slide.
     *
     * @returns {boolean} true if switching was successful
     *
     *
     *
     */

    lidl.Slider.prototype.showNextSlide = function () {


        try {
            this.showSlide(this.currentSlideIndex + 1);

        }
        catch (err) {
            this.showSlide(0);
            this.currentSlideIndex = 0;
            return true
        }
        this.currentSlideIndex++;
        return true;

    };


    /**
     *
     * Displays the given slide.
     *
     * @param {object} slideIndex Slide to display as jquery object
     */

    lidl.Slider.prototype.showSlide = function (slideIndex) //Index of next slide to display
    {


        var slide = this.slides[slideIndex];
        if (slide === undefined) {
            throw new RangeError();
        }
        if (this.slideAnimation === 'slide') {

            if (slideIndex < this.currentSlideIndex) {
                $('.current-slide').css({
                    'transform': 'translateX('+ this.width + ')'
                });

            }
            else {
                $('.current-slide').css({
                    'transform': 'translateX(-'+ this.width +')'
                });

            }
            $(slide).css({
                'transform': 'translateX(0px)'
            });
            $('.current-slide').removeClass('current-slide');
            $(slide).addClass('current-slide');
        }

        if (this.slideAnimation === 'blur') {
            var currentSlide = $('.current-slide');
            $(currentSlide).addClass('blur');
            $(currentSlide).removeClass('blur-active');
            $(currentSlide).removeClass('current-slide');
            $(slide).addClass('blur-active');
            $(slide).removeClass('blur');
            $(slide).addClass('current-slide');

        }


    };


    /**
     * Starts automatic slide changing.
     *
     */
    lidl.Slider.prototype.start = function () {
        console.log('starting slider');
        this.intervall = setInterval(this.showNextSlide.bind(this), this.delay);
    };

    lidl.Slider.prototype.stop = function () {
        console.log('stopping slider');
        clearInterval(this.intervall);
    };

    /**
     *
     * Add Slides to the slider
     *
     * @param {array} slide Jquery Object of slide to be added.
     * @returns {number} total number of slides in slider.
     *
     */
    lidl.Slider.prototype.addSlide = function (slide) {
        lidl.assert(slide);
        return this.slides.push(slide);

    };

    lidl.Slider.prototype.calcDimensions = function () {
        var refSlide = $(this.slides[0]);
        var height = refSlide.height() + 'px';
        var width  = refSlide.width() + 'px';

        this.height = height;
        this.width = width;

        $(this.parent).css('height', height);
        $(this.slides).css('height', height);
        $(this.navigation).css('height', height);
    };

    lidl.Slider.prototype.createNavigation = function () {
        for (var i = 0; i < this.slides.length; i++) {
            $(".slider-nav-label").append('<span class="nav-dot"></span>');
        }

    };

    lidl.Slider.prototype.setTransitionClass = function(slide){
        if (this.slideAnimation === 'slide') {
            $(slide).addClass('sliding');
        }
        if (this.slideAnimation === 'blur') {
            $(slide).addClass('blurring');
        }
    };
    return lidl;

}
(lidl = window.lidl || {},jQuery));


