import PageModule from "./PageModule"; // Adjust the import path as needed

interface JsModuleConfig {
    module: string;
    loaders: string[];
}

export default class PageModuleLoader {
    moduleName: string;
    pageModules: PageModule<any, any, any>[]; // Adjust generic types as needed

    constructor(name: string) {
        this.moduleName = name;
        this.pageModules = [];
    }

    addModule(pageModule: PageModule<any, any, any>): boolean { // Adjust generic types as needed
        if (this.hasModule(pageModule)) {
            return true;
        } else {
            this.pageModules.push(pageModule);
            return false;
        }
    }

    addModules(moduleArray: PageModule<any, any, any>[]): void { // Adjust generic types as needed
        for (const module of moduleArray) {
            this.addModule(module);
        }
    }

    async execute(): Promise<void> {
        // @ts-ignore
        let jsmodule: JsModuleConfig | undefined = window.jsmodule;
        if (jsmodule === undefined) {
            jsmodule = { loaders: [], module: "" }; // Initialize with empty loaders and module
        }

        if (jsmodule.module !== this.moduleName) {
            console.error(`[Error in PageModuleLoader '${this.moduleName}']: Invalid jsmodule information: Expected ${this.moduleName}, but found ${jsmodule.module}`);
            return;
        }

        for (const el of jsmodule.loaders) {
            const module = this.pageModules.find((mod) => mod.title === el);
            if (module !== undefined) {
                const { args = {}, data = {} } = await module.init({}); // Pass empty object as argument
                await module.build({args: args, data: data});
            }
        }
    }

    hasModule(pageModule: PageModule<any, any, any>): boolean { // Adjust generic types as needed
        return this.pageModules.findIndex((module) => module.title === pageModule.title) >= 0;
    }
}