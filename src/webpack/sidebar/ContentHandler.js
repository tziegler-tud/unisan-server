/**
 *
 * generates a new contentHandler object
 *
 * @param type {String}
 * @param handlerFunction {Function}
 * @param handlerArgs {Object}
 * @param handlerArgs.callback {Object}
 * @param handlerArgs.callback.onSave {Function}
 * @param handlerArgs.callback.onLoad {Function}
 * @constructor
 */
export default class ContentHandler {
    constructor(type, handlerFunction, handlerArgs = {}) {
        this.type = type;
        this.fn = handlerFunction;
        this.inputs = [];
        this.validators = [];
        let defaultArgs = {
            callback: {
                onSave: () => {
                    let handlerContent = []; //contains key-val pairs (id, value, inputType)
                    let inputs = document.querySelectorAll(".sidebar input");
                    inputs.forEach(el => {
                        let type = el.type;
                        let value;
                        switch(type){
                            case "checkbox":
                                value = el.checked;
                                break;
                            case "date":
                                value = el.value;
                                break;
                            default:
                                value = el.value;
                                break;
                        }
                        handlerContent.push({
                            id: el.id,
                            value: value,
                            type: type,
                        })
                    })
                    return handlerContent;
                },
                onLoad: (handlerContent) => {
                    handlerContent.forEach(entry => {
                        let el = document.getElementById(entry.id);
                        if (el === undefined || el === null) {

                        }
                        else {
                            let type = entry.type;
                            let value = entry.value;
                            switch(type){
                                case "checkbox":
                                    el.checked = value;
                                    break;
                                case "date":
                                    el.value = value;
                                    break;
                                default:
                                    el.value = value;
                                    break;
                            }
                        }
                    })
                },
            },
            validators: [],
        }


        this.args = Object.assign(defaultArgs, handlerArgs);
    }

    /**
     *
     * @param {Sidebar} sidebar
     * @param {Object} args
     * @param type
     * @returns {*}
     */
    apply(sidebar, args, type){
        return this.fn(sidebar, args, type, this);
    }
    save(){
        return this.args.callback.onSave();
    }
    load(handlerContent){
        return this.args.callback.onLoad(handlerContent);
    }
    removeCustomValidators(){
        this.validators = [];
    }
    addCustomValidator(func, callback) {
        this.validators.push({function: func, callback: callback});
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