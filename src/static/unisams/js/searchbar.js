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
        sb.innerHTML = '<label class="searchbar-label" for=' +id + '>Suche:</label><input id="searchbarInput'+ id +'" class="searchbar-input common-input"</input>'
        return sb;
    }

    var setupEventHandlers = function(self, searchbarHTML){
        let inputElement = $(searchbarHTML).children("input");
        if (self.searchbarArgs.onInput.enabled) {
            inputElement.on("input",function(){
                self.searchbarArgs.onInput.callback(inputElement.val());
            })
        }
    }

    return common.Searchbar;

}(window.common = window.common||{}, jQuery, undefined));