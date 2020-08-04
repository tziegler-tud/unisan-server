(function (common, $, undefined) {

    /**
     * @namespace: searchbar
     */

    common.searchbarCounter = 0;

    common.Searchbar = function(container, searchbarArgs){
        if (container === undefined) throw new Error("cannot instantiate search bar without container");
        common.searchbarCounter++;
        this.id = "searchbar" + common.searchbarCounter;
        searchbarArgs = applyArgs(searchbarArgs);
        this.searchbarArgs = searchbarArgs;
        this.domElements = {};
        this.isactive = true;

        //build html
        var searchbarHTML = buildHTML(this);
        setupEventHandlers(this, searchbarHTML);
        //append to container
        let current = container.innerHTML;
        container.append(searchbarHTML);

        return this;
    };

    var applyArgs = function(args){
        args = (args === undefined) ? {}: args;
        return args;
    };

    var buildHTML = function(self){
        let id = self.id;
        let sb = document.createElement("div");
        sb.className = "searchbar";
        sb.id= id;
        // sb.innerHTML = '<label class="searchbar-label" for=' +id + '>Suche:</label><input id="searchbarInput'+ id +'" class="searchbar-input common-input"</input>'

        let label = document.createElement("label");
        label.className = "searchbar-label";
        label.htmlFor = id;
        let s = "Suche:";
        if(typeof(self.searchbarArgs.label) === "string"){
            s = self.searchbarArgs.label;
        }
        label.innerHTML = s;
        if(!self.searchbarArgs.noLabel) {
            sb.append(label);
        }

        let input = document.createElement("input");
        input.className = "searchbar-input common-input";
        if(typeof(self.searchbarArgs.classes) === "string"){
            input.classList.add(self.searchbarArgs.classes)
        }
        input.id = "searchbarInput "+ id;
        sb.append(input);

        self.domElements.container = sb;
        self.domElements.label = label;
        self.domElements.input = input;

        return sb;
    };

    var setupEventHandlers = function(self, searchbarHTML){
        let inputElement = $(searchbarHTML).children("input");
        if (self.searchbarArgs.onInput.enabled) {
            inputElement.on("input",function(){
                self.searchbarArgs.onInput.callback(inputElement.val());
            })
        }
    };

    common.Searchbar.prototype.getInputElement = function(){
        return this.domElements.input;
    };

    common.Searchbar.prototype.isActive = function(){
        return this.isactive;
    };

    common.Searchbar.prototype.hide = function(){
        this.domElements.container.style.display = "none";
        this.isactive = false;
    }
    common.Searchbar.prototype.show = function(){
        this.domElements.container.style.display = "";
        this.isactive = true;
    }

    return common.Searchbar;

}(window.common = window.common||{}, jQuery, undefined));