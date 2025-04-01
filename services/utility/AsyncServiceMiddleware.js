import ServiceMiddleware from "./ServiceMiddleware.js";

export default class AsyncServiceMiddleware extends ServiceMiddleware{
    constructor(func, defaultArgs) {
        super(func, defaultArgs);
    }

    /**
     * executes the Middleware function. The provided function must return an object {result, data}
     * result is an int, anything other than 0 signals success
     * data is an arbitrary object and is passed back to the executioner
     * @param additionalArgs
     * @returns {{result: number, data: any}}
     */
    async call(additionalArgs){
        const callArgs = Object.assign(this.defaultArgs, additionalArgs);
        let middlewareResult = await this.func(callArgs);
        return {result: middlewareResult.result, data: middlewareResult.data};
    }
}