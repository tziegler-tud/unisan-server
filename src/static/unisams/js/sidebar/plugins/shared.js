export var registerBackButton = function(self, selector){

    $(selector).each(function(){
        $(this).on("click", function(e){
            self.toggle();
            $(this).toggleClass("btn-rotate");
        });
    })
};

export var registerConfirmButton = function(self, selector, action){
    var args = this;
    $(selector).on("click", function(args){
        action();
    });
};

export var registerButton = function(self, selector, action){
    var args = this;
    $(selector).on("click", function(args){
        action();
    });
};

export var getDataFromServer  = function(url, callback){

    // get qualification data from server
    $.ajax({
        url: url,
        type: 'GET',
        cache: false,
        isModified: false,
        data: {},
        success: callback,
    });
};


/**
 * ui elements
 */

export var createSelectDelimiter = function(classes){
    const delimiter = document.createElement('option');
    delimiter.innerHTML = "-----------------------";
    delimiter.disabled = true;
    return delimiter;

};



/**
 * applies 'viewBox-disabled' class to the given elements
 * @param elements an HTML Element or an array containing HTML Elements
 */
export var disableViewBox = function(elements) {
    var func = function(el) {
        el.disabled = true;
        el.classList.add("viewBox-disabled");
    };
    if(Array.isArray(elements)){
        elements.forEach(el=>func(el))
    }
    else func(elements)
};