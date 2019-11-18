(function (contact,$,undefined) {

    /* dev uses "avoid jQuery"...
     *
      * ... dev hurt itself in its confusion. */

    /*config variables*/
    var debug = false;


    /*local variables*/
    var maxId = 0;
    var DomHeaderClass = 'contact-heading';


    contact.ExpandingListItem = function (ref, cssClass){
        try{
            lidl.assertHTMLElement(ref,debug);
        }
        catch(err) {
            throw new Error('Failed to create new ExpandingListItem: invalid reference');
        }

        this.cssClass = cssClass;
        this.ref = ref;
        this.head = findHead(ref);
        this.collapsed = true;
        this.id = createId();


        this.setExpandingHeight = function(){
            var obj = ref.getElementsByClassName("contact-details")[0];
            var tar = obj.getElementsByClassName("contact-details-container")[0];
            lidl.assertHTMLElement(obj);
            lidl.assertHTMLElement(tar);
            $(obj).css('max-height',tar.offsetHeight); //TODO: remove jquery usage
        };

        this.expand = function(){
          this.collapsed = false;
          this.ref.classList.remove(this.cssClass);
        };

        this.collaps = function(){
            this.collapsed = true;
            this.ref.classList.add(this.cssClass);
        };

        this.addClickEvent = function(listItemArray){
            var self = this;
            var localRef = this.ref;
            if(this.head!==false) {
                localRef = this.head;
            }
            else {
                console.warn("Could not create onclick event handler: HTMLElement with class= "+DomHeaderClass +" was not found. Enabling click event for entire section.");
            }
            localRef.addEventListener('click', function (e) {
                if(self.collapsed){
                    for (var j = 0; j < listItemArray.length; j++) {
                        listItemArray[j].collaps();
                    }
                    self.expand();
                }
                else {self.collaps();}
            });


        };

        return this;
    };


    contact.ContactObject = function (scopeId, cssClass, classToToggle){
        var cssCl = (typeof cssClass === 'undefined') ? 'collapsed' : cssClass;
        var cssToggle = (typeof classToToggle === 'undefined') ? 'collapsed' : classToToggle;
        var parent = document.getElementById(scopeId);
        this.listItemArray = findExpandingListItems(parent,cssCl, cssToggle);

        return this;
    };

    contact.ContactObject.prototype.initializeEventListeners = function(){

        var listItemArray = this.getListItemArray();
        for (var i = 0; i < this.listItemArray.length; i++) {
            var item = listItemArray[i];
            item.addClickEvent(listItemArray);
            item.setExpandingHeight();
            contact.initResizeListener(item);
        }
        return true;
    };

    contact.ContactObject.prototype.getListItemArray = function(){
        return this.listItemArray;
    };


   function findExpandingListItems(parent, className, classToToggle){
       var refs = parent.getElementsByClassName(className);
       var ExpandingListItemArray = [];
       var i;
       for (i = 0; i < refs.length; i++) {
           var res;
           try{
               res = new contact.ExpandingListItem(refs[i],classToToggle);
           }
           catch(err) {
               console.error(err.name + ':' + err.message);
               continue;
           }
           ExpandingListItemArray.push(res);
       }

       return ExpandingListItemArray;
   }

   function createId(ClassName){
       return ClassName + maxId++;
   }

   function findHead(ref){
       var list = ref.getElementsByClassName(DomHeaderClass);
       try{
           lidl.assertHTMLElement(list[0],debug)
       }
       catch(e){
           return false;
       }

       return list[0];
   }


   contact.initResizeListener = function(item){
     window.addEventListener("resize", item.setExpandingHeight)
   };

    return contact;




}(window.contact = window.contact || {}, jQuery));