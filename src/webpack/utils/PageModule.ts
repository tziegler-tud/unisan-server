interface PageModuleConstructorArgs {
    title: string;
    pageData?: any;
    init: (args: any) => Promise<{ args: any; data: any }>;
    buildPage: (args: BuildPageSignature) => Promise<void>;
    updatePage?: (args: BuildPageSignature) => Promise<void>;
}

interface BuildPageSignature {
    args: any;
    data: any
}

export default class PageModule<TInitArgs, TPageData, TBuildArgs> {
    title: string;
    pageData: TPageData;
    initFunc: (args: TInitArgs) => Promise<{ args: TInitArgs; data: TPageData }>;
    buildPageFunc: (args: BuildPageSignature ) => Promise<void>;
    updatePageFunc: (args: BuildPageSignature) => Promise<void>;

    constructor({
                    title,
                    pageData = {} as TPageData,
                    init,
                    buildPage,
                    updatePage = async ({args, data}: BuildPageSignature) => {
                        await this.buildPage({args, data});
                    },
                }: PageModuleConstructorArgs) {
        this.title = title;
        this.pageData = pageData;
        this.initFunc = init;
        this.buildPageFunc = buildPage;
        this.updatePageFunc = updatePage;
    }

    async init(args: TInitArgs): Promise<{ args: TInitArgs; data: TPageData }> {
        console.log("loading js module: " + this.title);
        return await this.initFunc(args);
    }

    async build({args, data}: BuildPageSignature): Promise<void> {
        return await this.buildPageFunc({args, data});
    }

    async buildPage({args, data}: BuildPageSignature): Promise<void> {
        return this.build({args, data});
    }

    async updatePage({args, data}: BuildPageSignature): Promise<void> {
        return await this.updatePageFunc({args, data});
    }
}