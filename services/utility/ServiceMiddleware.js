export default class ServiceMiddleware {
    constructor(func, defaultArgs) {
        this.func = func;
        this.defaultArgs = defaultArgs;
    }

    setMethod(func){
        this.func = func;
    }

    setDefaultArgs(args){
        this.defaultArgs = args;
    }

    /**
     * executes the Middleware function. The provided function must return an object {result, data}
     * result is an int, anything other than 0 signals success
     * data is an arbitrary object and is passed back to the executioner
     * @param additionalArgs
     * @returns {{result: number, data: any}}
     */
    call(additionalArgs){
        const callArgs = Object.assign(this.defaultArgs, additionalArgs);
        let {result=0, data={}} = this.func(callArgs)
        return {result: result, data: data};
    }
}