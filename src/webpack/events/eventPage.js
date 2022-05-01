// factory for building html elements related to event pages

var EventPage = function(){
    //constructor
    return this;
};

EventPage.prototype.addComponent = function(componentType){
    let self = this;
    let component = new Component();
    switch(componentType) {
        case (self.componentTypes.DESCRIPTION):

            return component;
            break;
        case (self.componentTypes.DATE):
            break;
        case (self.componentTypes.LOCATION):
            break;
        case (self.componentTypes.GENERIC):
            //Create empty module
            break;
    }
};

var Component = function(){

};



EventPage.eventTypes = {
    eventTraining: "1",
    eventSeminar:  "2",
    eventSan:      "3",
    other:         "4",
};

EventPage.componentTypes = {
    DESCRIPTION:   "1",
    DATE:          "2",
    LOCATION:      "3",
    GENERIC:       "0",
};

export{EventPage}
