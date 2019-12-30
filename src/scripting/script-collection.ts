import IVM from "isolated-vm";
import _ from "lodash";
import Script from "scripting/script";
import ScriptRunner from "scripting/script-runner";
import ArgumentParser from "../core/argument-parser";

/**
 * A collection of scripts combined into a collection. These scripts are built together on instantiation
 * and can be referenced through the script path. This is primarily for use with scripts that need to be
 * built and used on startup.
 * @module scripting
 */
export default class ScriptCollection {
    public scriptRunner: ScriptRunner;
    private _prebuiltScripts: {[name: string]: Script};
    /**
     * Creates an instance of ScriptCollection.
     * @param {{[name: string]: string}} prebuiltScripts Scripts to build when the collection is created, by path.
     * @param {{[s: string]: object}} [addIns] A list of objects by name to add to the context of the prebuilt scripts.
     * @memberof ScriptCollection
     */
    constructor(prebuiltScripts: {[name: string]: string}, addIns?: {[s: string]: object}) {
        this.scriptRunner = new ScriptRunner();
        this._prebuiltScripts = this.scriptRunner.runManySync(
            this.scriptRunner.buildManySync(prebuiltScripts),
            {},
            addIns
        );
    }
    /**
     * Get the scripts that exist in the collection.
     *
     * @returns An array of tuples containing the script path and the script object.
     * @memberof ScriptCollection
     */
    public getScripts() {
        return Object.keys(this._prebuiltScripts).map((key) => [key, this._prebuiltScripts[key]] as [string, Script]);
    }

    /**
     * Execute a script in the context of the script collection.
     *
     * @param {string} code The script code to execute.
     * @param {string} args The execution arguments in a single string.
     * @param {IVM.Reference<any>} [entityValue] An IVM reference to use for the entity.
     * @param {IVM.Reference<any>} [playerValue] An IVM reference to use for the player.
     * @param {(specifier: string, referrer: IVM.Module) => IVM.Module} [moduleResolutionHandler] A function used
     *      to resolve modules.
     * @returns The run script.
     * @memberof ScriptCollection
     */
    public async runScript(
            code: string,
            args: string,
            entityValue?: IVM.Reference<any>,
            playerValue?: IVM.Reference<any>,
            moduleResolutionHandler?: (specifier: string, referrer: IVM.Module) => IVM.Module) {
        const argsArray = ArgumentParser.parse(args);
        return this.scriptRunner.build(
            code,
            {
                args: argsArray,
                entity: entityValue,
                me: playerValue
            },
            moduleResolutionHandler,
            undefined,
            500,
            this._prebuiltScripts
        );
    }
    /**
     * Build multiple scripts at once together.
     *
     * @param {{[s: string]: string}} pathsWithCode The scripts keyed by their paths.
     * @param {((specifier: string, referrer: IVM.Module) => [string, string] | undefined)} [moduleDependencyHandler] A
     *      function used to resolve modules.
     * @returns The built modules keyed by their paths
     * @memberof ScriptCollection
     */
    public buildScripts(
            pathsWithCode: {[s: string]: string},
            moduleDependencyHandler?: (specifier: string, referrer: IVM.Module) => [string, string] | undefined) {
        return this.scriptRunner.buildManySync(
            pathsWithCode,
            moduleDependencyHandler
        );
    }
    /**
     * Execute multiple pre-built scripts at once together.
     *
     * @param {{[s: string]: IVM.Module}} modulePaths The modules keyed by their paths.
     * @param {string} args The arguments to use for execution.
     * @param {IVM.Reference<any>} [entityValue] An IVM reference to use for the entity.
     * @param {IVM.Reference<any>} [playerValue] An IVM reference to use for the player.
     * @param {(specifier: string, referrer: IVM.Module) => IVM.Module} [moduleResolutionHandler]
     * @returns
     * @memberof ScriptCollection
     */
    public runScripts(
            modulePaths: {[s: string]: IVM.Module},
            args: string,
            entityValue?: IVM.Reference<any>,
            playerValue?: IVM.Reference<any>,
            moduleResolutionHandler?: (specifier: string, referrer: IVM.Module) => IVM.Module) {
        const argsArray = ArgumentParser.parse(args);
        return this.scriptRunner.runManySync(
            modulePaths,
            {},
            {
                args: argsArray,
                entity: entityValue,
                me: playerValue
            },
            500,
            false,
            moduleResolutionHandler
        );
    }
    /**
     * Convert an object into an external copy to be passed into an isolate.
     *
     * @param {*} obj The object to convert.
     * @returns The reference to be passed into an isolate.
     * @memberof ScriptCollection
     */
    public convert(obj: any) {
        return new IVM.ExternalCopy(obj).copyInto();
    }
    /**
     * Execute an exported function from a particular script.
     *
     * @param {string} scriptPath The path of the script to call the function of.
     * @param {string} name The name of the function.
     * @param {any[]} [params=[]] The parameters to use for the function.
     * @param {number} [timeout=500] How long to wait until giving up on executing the function.
     * @returns The function execution result.
     * @memberof ScriptCollection
     */
    public execute(scriptPath: string, name: string, params: any[] = [], timeout: number = 500) {
        const script = this.getScript(scriptPath);
        return script.execute(name, params, timeout);
    }
    /**
     * Execute an exported function from a particular script asynchronously.
     *
     * @param {string} scriptPath The path of the script to call the function of.
     * @param {string} name The name of the function.
     * @param {any[]} [params=[]] The parameters to use for the function.
     * @param {number} [timeout=500] How long to wait until giving up on executing the function.
     * @returns A promise which resolves to the function execution result.
     * @memberof ScriptCollection
     */
    public async executeAsync(scriptPath: string, name: string, params: any[] = [], timeout: number = 500) {
        const script = this.getScript(scriptPath);
        return await script.executeAsync(name, params, timeout);
    }
    /**
     * Execute an exported function from a particular script and return an IVM reference.
     *
     * @param {string} scriptPath The path of the script to call the function of.
     * @param {string} name The name of the function.
     * @param {...any} params The parameters to use for the function.
     * @returns An IVM reference to the result of the function call.
     * @memberof ScriptCollection
     */
    public executeReturnRef(scriptPath: string, name: string, ...params: any) {
        const funcRef = this.getScript(scriptPath).getReference(name);
        const context = this.getScript(scriptPath).context;
        const script = `
            export function run(func, ...args) {return new IVM.Reference(func(...args))};
        `;
        const tmpScript = this.scriptRunner.executeSync(script, {IVM}, undefined, context);
        const res = tmpScript.execute("run", [funcRef.derefInto(), ...params]);
        if (res.typeof === "undefined") {
            return undefined;
        }
        return res;
    }
    /**
     * Get an exported value from a particular script.
     *
     * @param {string} scriptPath The path of the script to get the value from.
     * @param {string} name The name of the value.
     * @returns {*} The value retrieved from the script.
     * @memberof ScriptCollection
     */
    public get(scriptPath: string, name: string): any {
        const script = this.getScript(scriptPath);
        return script.get(name);
    }
    /**
     * Run a script in an existing script's context with IVM priveleges.
     * This is used for cases where IVM must be used to retrieve things from the script.
     *
     * @param {string} scriptPath The path to the script to get the context to run the IVM script on.
     * @param {string} script The script to execute with IVM priveleges.
     * @returns
     * @memberof ScriptCollection
     */
    public runIVMScript(scriptPath: string, script: string) {
        const context = this.getScript(scriptPath).context;
        return this.scriptRunner.executeSync(script, {IVM}, undefined, context);
    }
    /**
     * Get a script from a particular script path
     *
     * @param {string} scriptPath The path of the script to get
     * @returns The script at that path
     * @memberof ScriptCollection
     */
    public getScript(scriptPath: string) {
        const script = this._prebuiltScripts[scriptPath];
        return script;
    }
}
