import PageSlider from "./pageSlider";

/**
 * @class PageSliderPage
 */
export default class PageSliderPage {
    /**
     *
     * @param parent {PageSlider}
     */
    constructor(parent) {
        this.id = parent.createPageId();
        this.parent = parent;
        this.data = {};
        this.container = {};
        this.objects = [];
        this.validators = [];
        this.onSave = async function () {
            return true;
        };
    };

    setContainer = function (c) {
        this.container = c;
    }

    /**
     * adds a custom object to a page. Object is stored in page data object
     * @param key object key
     * @param value object value
     */
    addObject = function(key, value) {
        if (key === undefined) {
            console.error("failed to add object to Page data: invalid key")
        }
        if (value === undefined) {
            console.error("failed to add object to Page data: invalid object")
        }
        this.objects.push({key: key, value: value});
    };
    setOnSaveCallback = function(func) {
        this.onSave = func;
    }
    async save (){
        let self = this;
        //saves the data and moves on to the next page
        $(this.container).find(".pageslider-page-dataElement").each(function(){
            let key = this.name;
            if (key === undefined) key = "undefined";
            self.data[key]= this.value;
        })
        await this.onSave();
        this.objects.forEach(function(el){
            let key = el.key;
            self.data[key]= el.value;
        })

        this.parent.savePageData(this, this.data);
        return this.data;
    }
    nextPage(){
        //displays next page without saving
        this.parent.nextPage();
    }

    previousPage(){
        //displays previous page
        this.parent.previousPage();
    }
    show(){
        this.container.classList.remove("page-hidden");
        this.container.classList.add("page-active");
    }
    hide(){
        this.container.classList.add("page-hidden");
        this.container.classList.remove("page-active");
    }

    addCustomValidator(func, callback) {
        this.validators.push({function: func, callback: callback});
    }

    checkRequiredFields(){
        let valid = true;
        //find all inputs
        $(this.container).find(".pageslider-page-dataElement").reverse().each(function(){
            if(this.required === true){
                if (this.value.length === 0) {
                    let el = this;
                    //if mdc text field, find the container
                    if (this.classList.contains("mdc-text-field__input")){
                        el = $(this).parents(".mdc-text-field")
                    }
                    //trigger html5 styling by adding some input and removing it
                    el.value = 1;
                    el.value = "";
                    el.focus();
                    $(el).effect("shake", {distance: 2, times: 1}, "fast");
                    valid = false;
                }
            }
        })
        return valid;
    }

    validate(){
        var valid = true;
        this.validators.forEach(function(validator){
            //execute validator function
            try {
                let result = validator.function()
                if(typeof(result)==="boolean") result = {state: result, reason: "failed"}
                if(result.state) {
                    validator.callback.onSuccess()
                }
                else {
                    validator.callback.onFailure(result.reason);
                    valid = false;
                }
            }
            catch(e) {
                console.error("callback error: " + e)
                return false;
            }
        })
        return valid;
    }
}