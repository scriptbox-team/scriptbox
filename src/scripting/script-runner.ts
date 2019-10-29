import IVM from "isolated-vm";
import _ from "lodash";
import path from "path";
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
        this._isolate = new IVM.Isolate({inspector: true});
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
            timeout?: number,
            modulePaths: {[path: string]: Script} = {}
    ): Promise<Script> {
        if (context === undefined) {
            context = this.makeContext(false, addIns);
        }
        else {
            this._addToContext(context, addIns);
        }
        const transpiledCode = this._transpile(code);
        const module = await this._isolate.compileModule(transpiledCode);
        const moduleList = _.reduce(modulePaths, (acc, value, key) => {
            acc[key] = value.module;
            return acc;
        }, {} as {[path: string]: IVM.Module});
        if (moduleResolutionHandler !== undefined) {
            await module.instantiate(context, moduleResolutionHandler);
        }
        else {
            await module.instantiate(context, async (modulePath) => {
                return this._defaultModuleInstantiation(
                    path.join(process.cwd(), "__scripted__", "code.ts"),
                    modulePath,
                    moduleList
                );
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
            context = this.makeContext(false, addIns);
        }
        else {
            this._addToContext(context, addIns);
        }
        const transpiledCode = this._transpile(code);
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
        const modulesInverse = new WeakMap<IVM.Module, string>();
        const modules: {[s: string]: IVM.Module} = _.transform(pathsWithCode, (acc, code, codePath) => {
            const transpiledCode = this._transpile(code);
            acc[codePath] = this._isolate.compileModuleSync(transpiledCode);
            modulesInverse.set(acc[codePath], codePath);
        }, {} as {[s: string]: IVM.Module});
        return _.transform(modules, (acc, module, codePath) => {
            const context = this.makeContext(true, addIns![codePath]);
            if (globalAccess) {
                context.global.setSync("global", context.global.derefInto());
                context.global.setSync("_log", new IVM.Reference(this._log));
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
            module.instantiateSync(context, (modulePath, referringModule) => {
                return this._defaultModuleInstantiation(modulesInverse.get(referringModule)!, modulePath, modules);
            });
            const result = module.evaluateSync();
            acc[codePath] = new Script(module, context, result);
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
    public makeContext(inspector: boolean, addIns: object = {}) {
        const context = this._isolate.createContextSync({inspector});
        this._addToContext(context, addIns);
        return context;
    }

    private _addToContext(context: IVM.Context, addIns: object = {}) {
        for (const [key, value] of Object.entries(addIns)) {
            let valueToCopy = value;
            if (Array.isArray(value) || typeof value === "object" && value !== null) {
                valueToCopy = new IVM.ExternalCopy(value).copyInto();
            }
            context.global.setSync(key, valueToCopy);
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
    private _transpile(input: string): string {
        try {
            const compileOptions = {compilerOptions: {target: ts.ScriptTarget.ES2016}};
            return ts.transpileModule(input, compileOptions).outputText;
        }
        catch (err) {
            throw err;
        }
    }

    private _log(message: string) {
        console.log(message);
    }

    private _defaultModuleInstantiation(dir: string, requirePath: string, modules: {[path: string]: IVM.Module}) {
        let pathsToTry = [requirePath];
        const extension = path.extname(requirePath);
        if (extension === "") {
            const assumedFiletypes = [".ts", ".js"];
            pathsToTry = pathsToTry.concat(assumedFiletypes.map((ext) => requirePath + ext));
        }
        else if (![".ts", ".js"].includes(extension)) {
            throw new Error("Modules with extension \"" + extension + "\" are not supported using require.");
        }
        for (const tryPath of pathsToTry) {
            const codeDir = path.dirname(dir);
            const modulePath = path.join(codeDir, tryPath);
            if (modules[modulePath] !== undefined) {
                return modules[modulePath];
            }
        }
        throw new Error("No module \"" + requirePath + "\" is available.");
    }
}
