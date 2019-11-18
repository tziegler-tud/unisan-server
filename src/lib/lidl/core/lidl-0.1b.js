/**
 * This is lidl, the little improvised Dranske library.
 * More than an actual library, this is a bunch of functions used in the website project "Sonne Wind Dranske"
 * Let's give credit to the name and keep it simple.
 *
 * Reworked version of inital 0.1a release. Check Changelog.
 * Main difference to previous version is that code got more complicated while doing the same as before. Hell, what am I doing?
 * --Note to myself: write Changelog.
 *
 *
 *
 *
 * Version: 0.1b
 * Release: 19.02.2018
 *
 *
 * @namespace lidl
 *
 */

(function (lidl,$,undefined) {

    /*
    Globals
     */

    var debugCategoriesPresent = [];


    /*
    Part I: Lidl main classes
     */


    /******************************************************************************************************************
     *                              \o/
     * Lidl Main Section             |
     *                              / \
     *****************************************************************************************************************/

    /**
     *
     * Constructor of lidl main object
     *
     *
     * @constructor
     * @class
     *
     */

    lidl.Main = function (){

        var self = this;
        this.name = "lidl-main";

        this.managers = [];



        return this;
    };


    /**
     * Adds an Manager to the lidl main object
     *
     *
     * @param managerObject {lidlManager} Manager to be added
     * @param isUnique {boolean} true if this manager is meant to be the only one of his type
     */
    lidl.Main.prototype.addManager =  function (managerObject,isUnique){

        console.log("registering new Manager...");

        this.managers.forEach(function (){
            if(isUnique && this.type == managerObject.type){
                var message = "lidlE0x04 - manager already set"
                throw new Error(message);
            }
        });

        this.managers.push(managerObject);
        console.log("Manager registration succesfull, checking for role...");

        if (managerObject.type=="objectManager"){
            this.objectManager = managerObject;
            console.log("found role: " + managerObject.type);
        }
    };

    /**
     * Manager abstract class. Implement this with your manager.
     *
     * @abstract
     *
     * @constructor
     */

    lidl.LidlManager = function(){
        var type;

        if (this.constructor === lidl.LidlManager) {
            throw new Error('Cannot instanciate abstract class');
        }

        return this;
    };



    /******************************************************************************************************************
     *                              \o/
     * Object Manger Section         |
     *                              / \
     *****************************************************************************************************************/


    /**
     *
     * Constructor of lidl object manager
     *
     * @extends lidl.LidlManager
     *
     *
     * @constructor
     * @class
     *
     */

    lidl.ObjectManager = function(){

        lidl.LidlManager.apply(this, arguments);

        var self = this;

        this.type="objectManager";

        this.objectCount = 0;
        this.objectMap = new Map();



        return this;
    };

    /**
     * generates a new object token
     *
     * @returns {string} generated token
     * @public
     *
     */

    lidl.ObjectManager.prototype.createNewObjectToken = function (){
        this.objectCount++;
        return "lidlObjTok"+this.objectCount;
    };

    /**
     *
     * Adds an Object to the manager. Creates a token for further addressing.
     *
     * @param object {lidlObject} object to be added
     * @returns {string} string-typed token to adress object when dealing with the manager
     *
     * @public
     */

    lidl.ObjectManager.prototype.addObject =  function(object,token){

        (typeof token === 'undefined') ? this.createNewObjectToken() : token;
        this.objectMap.set(token, object);
        console.log("successfully added object with token: " + token);
        return token;
    };

    /**
     *
     * Removes an object from the manager
     *
     *
     * @param token {string} object token
     * @returns {boolean} true if Object was succesfully removed
     *
     * @public
     */
    lidl.ObjectManager.prototype.removeObject = function(token){

        return true;

    };



    /*
    Part II: Small helper functions
     */

    /**
     * check if an object is relevant. Returns an error if:
     * bool: false
     * string: empty
     * number: zero or null
     * object: null, no properties or not DOM element
     *
     *
     * @param {object} condition The object to test
     * @param {boolean} [optionalDebugInfo=false] Enable debug output in console. Optional.
     * @param {string} [optionalMessage="assert error"] Message to be displayed if error occurs. Optional.
     *
     * @returns {boolean}
     */

    lidl.assert = function (condition, optionalDebugInfo, optionalMessage) {

        var message = (typeof optionalMessage === 'undefined') ? 'assert error' : optionalMessage;
        var DebugInfo = (typeof optionalDebugInfo === 'undefined') ? 0 : optionalDebugInfo;

        if (condition == null) {
            message = message + " || assertion failed - object is null";
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
            throw message;
        }
        if (DebugInfo) {
            console.log("asserting object" + condition);
            console.log("object id:" + condition.id);
        }

        var conditiontype = typeof condition;
        if (DebugInfo) console.log("typeof " + condition + " = " + conditiontype);

        if (typeof condition == 'boolean') {
            if (!condition) {
                message = message + " || assertion failed - Bool false";
                if (typeof Error !== "undefined") {
                    throw new Error(message);
                }
                throw message;
            }
            return true;
        }
        if (typeof condition == 'string') {
            if (condition.length === 0) {
                message = message + " || assertion failed - string empty";
                if (typeof Error !== "undefined") {
                    throw new Error(message);
                }
                throw message;
            }
            return true;
        }
        if (typeof condition == 'number') {
            if (condition === 0) {
                message = message + " || assertion failed - number is null";
                if (typeof Error !== "undefined") {
                    throw new Error(message);
                }
                throw message;
            }
            return true;
        }
        if (typeof condition == 'object') {
            if (lidl.isDOMNode(condition)) {
                if (lidl.isDOMElement(condition)) return true;
                message = message + " || assertion failed - object is DOM Node but not HTML element";
                if (typeof Error !== "undefined") {
                    throw new Error(message);
                }
            }
            if (lidl.isEmpty(condition)) {
                message = message + " || assertion failed - object is null or empty";
                if (typeof Error !== "undefined") {
                    throw new Error(message);
                }
                throw message;
            }
            return true;
        }
        else throw new Error('unknown type');
    };

    lidl.assertHTMLElement = function (condition,optionalDebugInfo, optionalMessage) {
        var message = (typeof optionalMessage === 'undefined') ? 'assert error: object is DOM Node but not HTML element' : optionalMessage;
        var DebugInfo = (typeof optionalDebugInfo === 'undefined') ? 0 : optionalDebugInfo;
        if(DebugInfo){
            console.log("asserting object" + condition);
            console.log("object id:" + condition.id);
        }
        if (lidl.isDOMNode(condition)) {
            if (lidl.isDOMElement(condition)) return true;
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
        }
        else throw new Error('Object is not HTML Node');
    };


    //returns true if js object is empty. ATTENTION: does not work for DOM Elements and Nodes
    lidl.isEmpty = function (obj) {
        if (obj == null) return true;
        if (obj.length > 0) return false;
        if (obj.length === 0) return true;
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
        }
        return true;
    };

    //Returns true if it is a DOM node
    lidl.isDOMNode =function (o) {
        return (
            typeof Node === "object" ? o instanceof Node :
                o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
        );
    };

    //Returns true if it is a DOM element
    lidl.isDOMElement = function (o) {
        return (
            typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
        );
    };


    //Sets css properties for html elements
    lidl. object_setCssProperty =function (object, property, value, optionalSkipObjectTest) {

        var skipObjectTest = (typeof optionalSkipObjectTest === 'undefined') ? false : optionalSkipObjectTest;

        if (!skipObjectTest) {
            try {
                lidl.assertHTMLElement(object);
            }
            catch (err) {
                console.log('Error in function object_setCssProperty: argument is not an HTML Element');
                return false;
            }
        }

        var expr = 'object.style.' + property + '=' + value;
        eval(expr);

        return (object.style.opacity == value);
        //TODO: Test it!
    };

/**
 *
 *
 * SECTION: category-assisted debugging methods.
 *
 * */

    /**
     * Checks whether debugging is enabled for the given category, and evals the expression if positive.
     *
     *  @param {string} expression A javascript expression to be run for debugging.
     *  @param {debugCategory[]} [categoriesArray="[full]"] Assign category for selective debugging. Optional.
     *     *
     *  @returns {boolean}
    */
    lidl.debug = function(expression, categoriesArray){
        var catArray = (typeof categoriesArray === 'undefined') ? [lidl.debugCategory.FULL] : categoriesArray;
        if(!Array.isArray(catArray)) {
            try{
                catArray = [categoriesArray];
            }
            catch(e){
                throw new TypeError("TypeError: Wrong type given in function "+ "lidl.debug(expression, categoriesArray). \nRequiered: lidl.debugCategory[] found: "+ typeof(categoriesArray).toString);
            }
        }

        catArray.forEach(function(el){

            if(debugSelect(el)) {
                try {
                    eval(expression)
                } catch (e) {
                    console.error("Error evaluating debug expression: " + expression + "with error: "+ e);
                    return false;
                }
                return true;
            }
        });
    };


    /*Enums */

    lidl.debugCategory = Object.freeze({
        FULL   :0,
        ASSERT :1,
        SCROLL :2,
        RESIZE :3
    });


    /* getter & setter methods */

    /**
     * Returns an enum array containing the currently selected categories for debugging.
     *
     * @returns {debugCategory[]}
     */
    lidl.getDebugCategories = function(){
        return debugCategoriesPresent;
    };

    /**
     *
     * Sets the categories for debugging.
     * Returns an enum array containing the currently selected categories for debugging.
     *
     * @param {debugCategory[]} categories Enum Array containing the categories to enable debugging for.
     *
     * @returns {debugCategory[]}
     */
    lidl.setDebugCategories = function(categories){
        return debugCategoriesPresent;
    };


    /**
     *
     * Adds a category for debugging.
     * Returns an enum array containing the updated categories for debugging.
     *
     * @param {debugCategory} category the categories to enable debugging for.
     *
     * @returns {debugCategory[]} The updated set of selected categories.
     */

    lidl.addDebugCategory = function(category){
        debugCategoriesPresent.forEach(function(el){
            if(el==category){
                return debugCategoriesPresent;
            }
        });
        debugCategoriesPresent.push(category);
        return debugCategoriesPresent;
    };

    /**
     *
     * Removes a category for debugging.
     * Returns an enum array containing the updated categories for debugging.
     *
     * @param {debugCategory} category Enum Array containing the categories to enable debugging for.
     *
     * @returns {debugCategory[]} The updated set of selected categories.
     */

    lidl.removeDebugCategory = function(category){
        debugCategoriesPresent.forEach(function(el){
            if(el==category){
                debugCategoriesPresent.splice(i,1);
            }
        });
        return debugCategoriesPresent;
    };





    /* internal methods */

    function debugSelect(debugCategory){
        var a = debugCategoriesPresent.indexOf(debugCategory);
        return (a!==-1);
    }




    return lidl;
}(window.lidl = window.lidl||{},jQuery));