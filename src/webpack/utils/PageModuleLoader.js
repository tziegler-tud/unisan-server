export default class PageModuleLoader {
    constructor(name) {
        this.moduleName = name
        /**
         *
         * @type {PageModule[]}
         */
        this.pageModules = [];
    }

    /**
     *
     * @param {PageModule} pageModule
     * @returns {boolean}
     */
    addModule(pageModule){
        if(this.hasModule(pageModule)) {
            return true
        }
        else {
            this.pageModules.push(pageModule);
        }
    }
    /**
     *
     * @param {PageModule[]} moduleArray
     */
    addModules(moduleArray){
        for(const module of moduleArray){
            this.addModule(module);
        }
    }

    execute(){
        //read from window.jsmodule which modules are to be loaded
        let jsmodule = window.jsmodule;
        if (jsmodule === undefined) jsmodule = {loaders: []};

        if(!jsmodule.module === this.moduleName) {
            console.error("[Error in PageModuleLoader '"+this.moduleName + "']: Invalid jsmodule information: Expected " + this.moduleName + ", but found " + jsmodule.module)
            return false;
        }

        jsmodule.loaders.forEach(async (el) => {
            //see if corresponding loader is present
            let module = this.pageModules.find(mod => mod.title === el);
            if (module !== undefined) {
                const {args={}, data={}} = await module.init();
                await module.build(args, data);
            }
        })
    }
    hasModule(pageModule) {
        return this.pageModules.findIndex(module => module.title === pageModule.title) >= 0;
    }
}