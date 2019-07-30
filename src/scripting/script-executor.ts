import IVM from "isolated-vm";
import _ from "lodash";
import * as ts from "typescript";
import Script from "./script";

/**
 * A class which handles arbitrary script execution.
 * This has the ability to compile and run javascript code.
 *
 * @export
 * @class ScriptExecutor
 */
export default class ScriptExecutor {
    private _isolate: IVM.Isolate;
    /**
     * Creates an instance of ScriptExecutor.
     * @memberof ScriptExecutor
     */
    constructor() {
        this._isolate = new IVM.Isolate();
    }
    /**
     * Execute some code asynchronously.
     *
     * @param {string} code The code to execute
     * @param {object} [addins={}] The values to add to the context before executing
     * @returns {Promise<any>} A promise which resolves to the last value in the code.
     * @memberof ScriptExecutor
     */
    public async execute(code: string, addIns: object = {}, context?: IVM.Context): Promise<any> {
        if (context === undefined) {
            context = this.makeContext(addIns);
        }
        else {
            this.addToContext(context, addIns);
        }
        const transpiledCode = this.transpile(code);
        const script = await this._isolate.compileScript(transpiledCode);
        const result = await script.run(context);
        return result;
    }

    public executeSync(code: string, addIns: object = {}, context?: IVM.Context): any {
        if (context === undefined) {
            context = this.makeContext(addIns);
        }
        else {
            this.addToContext(context, addIns);
        }
        const transpiledCode = this.transpile(code);
        const script = this._isolate.compileScriptSync(transpiledCode);
        const result = script.runSync(context);
        return result;
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
            context?: IVM.Context
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
        await module.evaluate();
        return new Script(module, context);
    }

    public buildSync(
            code: string,
            addIns: object = {},
            moduleResolutionHandler?: (specifier: string, referrer: IVM.Module) => IVM.Module,
            context?: IVM.Context
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
        module.evaluateSync();
        return new Script(module, context);
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
            module.evaluateSync();
            acc[path] = new Script(module, context);
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
            context.global.set(key, value);
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
