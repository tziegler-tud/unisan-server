import HandlerFunctionError from "./HandlerFunctionError";

export default class HandlerFunctionResult {
    errors?: HandlerFunctionError[] = []

    constructor() {
    }

    addError(error: HandlerFunctionError) {
        this.errors.push(error);
    }
}