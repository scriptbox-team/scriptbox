import IVM from "isolated-vm";

/**
 * A single script which has been executed.
 * This will contain the returned value of the execution as well as functions to interact
 * with anything which has been exported from the script.
 * @module scripting
 */
export default class Script {
    public context: IVM.Context;
    public result: any;
    public module: IVM.Module;
    /**
     * Creates an instance of Script.
     * @param {IVM.Module} module The module for the script.
     * @param {IVM.Context} context The context for the script.
     * @param {*} result The result from executing the script.
     * @memberof Script
     */
    constructor(module: IVM.Module, context: IVM.Context, result: any) {
        this.module = module;
        this.context = context;
        this.result = result;
    }
    /**
     * Execute a function that is exported from the script.
     *
     * @param {string} name The name of the function to execute
     * @param {*} params The parameters to pass to the function.
     * @param {number} [timeout=500] The amount of time to wait before giving up on the execution.
     * @returns The result from executing the function.
     * @memberof Script
     */
    public execute(name: string, params: any, timeout: number = 500) {
        const module = this.module;
        const funcRef = module.namespace.getSync(name);
        if (funcRef.typeof !== "function") {
            throw new Error("Function \"" + name + "\" not found in script.");
        }
        return funcRef.applySync(undefined, params, {timeout});
    }
    /**
     * Execute a function that is exported from the script asynchronously.
     *
     * @param {string} name The name of the function to execute
     * @param {*} params The parameters to pass to the function.
     * @param {number} [timeout=500] The amount of time to wait before giving up on the execution.
     * @returns The result from executing the function.
     * @memberof Script
     */
    public async executeAsync(name: string, params: any, timeout: number = 500) {
        const module = this.module;
        const funcRef = module.namespace.getSync(name);
        if (funcRef.typeof !== "function") {
            throw new Error("Function \"" + name + "\" not found in script.");
        }
        return await funcRef.apply(undefined, params, {timeout});
    }
    /**
     * Get a value that is exported from the script.
     *
     * @param {string} name The name of the value
     * @returns {*} The value.
     * @memberof Script
     */
    public get(name: string): any {
        const module = this.module;
        const funcRef = module.namespace.getSync(name);
        if (funcRef.typeof === "undefined") {
            return undefined;
        }
        return funcRef.copySync();
    }
    /**
     * Get a value reference that is exported from the script
     *
     * @param {string} name The name of the value.
     * @returns {IVM.Reference<any>} A reference to the value.
     * @memberof Script
     */
    public getReference(name: string): IVM.Reference<any> {
        const module = this.module;
        const funcRef = module.namespace.getSync(name);
        return funcRef;
    }
    /**
     * Release the script context.
     *
     * @memberof Script
     */
    public release() {
        this.context.release();
    }
}
