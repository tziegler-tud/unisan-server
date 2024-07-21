export default class PageModule {
    /**
     *
     * @param {String} title
     * @param {Object} pageData
     * @param {Function} init
     * @param {Function} buildPage
     * @param {Function} updatePage
     */
    constructor({
        title,
        pageData={},
        init,
        buildPage,
        updatePage=(args, data)=>{return this.buildPage(args, data)}
        }) {
        this.title = title;
        this.pageData = pageData;
        this.initFunc = init;
        this.buildPageFunc = buildPage;
        this.updatePageFunc = updatePage;
    }

    async init(args){
        console.log("loading js module: " + this.title);
        return await this.initFunc(args);
    }

    async build(args={}, data={}) {
        return await this.buildPageFunc({args, data});

    }
    async buildPage(args={}, data={}){
        return this.build(args, data);
    }

    async updatePage(args={}, data={}){
        return await this.updatePageFunc(args, data);
    }
}