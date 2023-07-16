export default class ComponentObserver {
    constructor(resolveFunc){
        this.resolveFunc = resolveFunc;
    }
    inform({event, data}){
        this.resolveFunc(event, data);
    }
    setHandler(resolveFunc) {
        this.resolveFunc = resolveFunc;
    }
}