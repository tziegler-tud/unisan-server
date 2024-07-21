export default class SubpageHandler {
    /**
     *
     * @param {Docker} docker
     */
    constructor(docker) {
        this.defaultGroup = 99;
        this.counter = new Counter(0);
        this.ordinals = new Ordinals(this.defaultGroup)
        this.subpages = [];
        this.docker = docker;

    }

    findById(id){
        return this.subpages.find(e => e.id === id);
    }

    add(subpage) {
        this.subpages.push(subpage);
        //handle dom positioning
        //place subpage container at correct position
        let subpageDomElement = document.getElementById(subpage.id);
        switch (subpage.position.place) {
            case "auto":
                //auto positioned elements are assigned ordinal group 0
                subpageDomElement.style.order = this.defaultGroup
                break;
            case "first":
                //assign order attribute smaller than all other subpages
                let lowest = this.ordinals.getNewLowestGroup();
                subpageDomElement.style.order = lowest;
                break;
            case "last":
                //assign order attribute higher than all other subpages
                let highest = this.ordinals.getNewHighestGroup();
                subpageDomElement.style.order = highest;
                break;
            case "fixed":
                //assign to a fixed ordinal group
                let group = subpage.position.group;
                this.ordinals.addGroup(group);
                subpageDomElement.style.order = group;
                break;
        }
    }

    remove(id) {
        let index = this.subpages.findIndex(e=> e.id === id);
        if(index > -1) {
            let subpageDomElement = document.getElementById(this.subpages[index].id);
            subpageDomElement.remove();
            this.subpages.splice(index, 1);
            return id;
        }
        else return false;
    }
    show(id){
        let page = this.findById(id);
        //add css class to page
        let dom = document.getElementById(id);
        dom.classList.add("subpage-active");
    }
    hide(id){
        let page = this.findById(id);
        //add css class to page
        let dom = document.getElementById(id);
        dom.classList.remove("subpage-active");
    }

    /**
     * regenerates the subpage with new data
     * @param id - subpage id
     * @param type - see signature of addDockerSubpage method
     * @param data - see signature of addDockerSubpage method
     */
    update(id, type, data){
        this.docker.addDockerSubPage(type, data, {overwrite: true}, id, this.docker.dockerAcl)
    }
    generateId(){
        return "docker-subpage_" + this.counter.increase();
    }
}

class Counter {
    constructor(initialValue=0) {
        this.value = initialValue;
    }
    increase(){
        this.value++;
        return this.value;
    }

    getValue(){
        return this.value;
    }
    setValue(value){
        this.value = value;
    }
}

class Ordinals {
    constructor(defaultGroup=99) {
        this.lowest = defaultGroup;
        this.highest = defaultGroup;
        this.groups = [defaultGroup];
    }
    getNewLowestGroup(){
        this.lowest = this.lowest - 1;
        this.groups.push(this.lowest);
        return this.lowest;
    }

    getNewHighestGroup(){
        this.highest = this.highest++;
        this.groups.push(this.highest);
        return this.highest;
    }
    getGroups(){
        return this.groups;
    }
    addGroup(group){
        if(!this.groups.includes(group)){
            this.groups.push(group);
            if(group > this.highest) this.highest = group;
            else if(group < this.lowest) this.lowest = group;
        }
    }

}