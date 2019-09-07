import IVM from "isolated-vm";
import _ from "lodash";
import ts from "typescript";
import Script from "./script";

/**
 * A class which handles arbitrary script execution.
 * This has the ability to compile and run javascript code.
 *
 * @export
 * @class ScriptExecutor
 */
export default class ScriptRunner {
    private _isolate: IVM.Isolate;
    /**
     * Creates an instance of ScriptExecutor.
     * @memberof ScriptRunner
     */
    constructor() {
        this._isolate = new IVM.Isolate();
    }

    /**
     * Execute some module code asynchronously.
     * This is specifically designed for use with classes.
     *
     * @param {string} code The module to execute
     * @param {object} [addins={}] The values to add to the context before executing
     * @returns {Promise<IVM.Reference<any>>} A reference to the exports of the module
     * @memberof ScriptExecutor
     */
    public async build(
            code: string,
            addIns: object = {},
            moduleResolutionHandler?: (specifier: string, referrer: IVM.Module) => IVM.Module | Promise<IVM.Module>,
            context?: IVM.Context,
            timeout?: number
    ): Promise<Script> {
        if (context === undefined) {
            context = this.makeContext(addIns);
        }
        else {
            this.addToContext(context, addIns);
        }
        const transpiledCode = this.transpile(code);
        const module = await this._isolate.compileModule(transpiledCode);
        if (moduleResolutionHandler !== undefined) {
            await module.instantiate(context, moduleResolutionHandler);
        }
        else {
            await module.instantiate(context, (modulePath) => {
                throw new Error("No module of name \"" + modulePath + "\" is available.");
            });
        }
        const opts = timeout !== undefined ? {timeout} : undefined;
        const result = await module.evaluate(opts);
        return new Script(module, context, result);
    }

    public buildSync(
            code: string,
            addIns: object = {},
            moduleResolutionHandler?: (specifier: string, referrer: IVM.Module) => IVM.Module,
            context?: IVM.Context,
            timeout?: number
    ): Script {
        if (context === undefined) {
            context = this.makeContext(addIns);
        }
        else {
            this.addToContext(context, addIns);
        }
        const transpiledCode = this.transpile(code);
        const module = this._isolate.compileModuleSync(transpiledCode);
        if (moduleResolutionHandler !== undefined) {
            module.instantiateSync(context, moduleResolutionHandler);
        }
        else {
            module.instantiateSync(context, (modulePath) => {
                throw new Error("No module of name \"" + modulePath + "\" is available.");
            });
        }
        const opts = timeout !== undefined ? {timeout} : undefined;
        const result = module.evaluateSync(opts);
        return new Script(module, context, result);
    }

    public buildManySync(
        pathsWithCode: {[s: string]: string},
        addIns?: {[s: string]: object},
        globalAccess: boolean = true
    ): {[s: string]: Script} {
        if (addIns === undefined) {
            addIns = {};
        }
        const modules: {[s: string]: IVM.Module} = _.transform(pathsWithCode, (acc, code, path) => {
            const transpiledCode = this.transpile(code);
            acc[path] = this._isolate.compileModuleSync(transpiledCode);
        }, {} as {[s: string]: IVM.Module});
        return _.transform(modules, (acc, module, path) => {
            const context = this.makeContext(addIns![path]);
            if (globalAccess) {
                context.global.setSync("global", context.global.derefInto());
                context.global.setSync("_log", new IVM.Reference(this.log));
                // Just a simple test log function
                // Essentially taken from the isolated-vm readme
                this._isolate.compileScriptSync(
                `
                    const log = global._log;
                    global._log = undefined;
                    global.log = (...args) => {
                        return log.applyIgnored(undefined, args.map(arg => new IVM.ExternalCopy(arg).copyInto()));
                    };
                `).runSync(context);
            }
            module.instantiateSync(context, (requirePath) => {
                if (modules[requirePath] === undefined) {
                    throw new Error("No module of name \"" + requirePath + "\" is available.");
                }
                return modules[requirePath];
            });
            const result = module.evaluateSync();
            acc[path] = new Script(module, context, result);
        }, {} as {[s: string]: Script});
    }

    /**
     * Create the context for a script execution
     *
     * @private
     * @param {object} [addins={}] The values to add to the context
     * @returns The context for script execution.
     * @memberof ScriptExecutor
     */
    public makeContext(addIns: object = {}) {
        const context = this._isolate.createContextSync();
        this.addToContext(context, addIns);
        return context;
    }

    private addToContext(context: IVM.Context, addIns: object = {}) {
        for (const [key, value] of Object.entries(addIns)) {
            let valueToCopy = value;
            if (Array.isArray(value) || typeof value === "object" && value !== null) {
                valueToCopy = new IVM.ExternalCopy(value).copyInto();
            }
            context.global.set(key, valueToCopy);
        }
    }

    /**
     * Transpile code from typescript to javascript
     *
     * @private
     * @param {string} input The typescript code to transpile
     * @returns {string} The resulting javascript code
     * @memberof ScriptExecutor
     */
    private transpile(input: string): string {
        try {
            const compileOptions = {compilerOptions: {target: ts.ScriptTarget.ES2016}};
            return ts.transpileModule(input, compileOptions).outputText;
        }
        catch (err) {
            throw err;
        }
    }

    private log(message: string) {
        console.log(message);
    }
}
