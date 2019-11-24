import IVM from "isolated-vm";
import _ from "lodash";
import Script from "scripting/script";
import ScriptRunner from "scripting/script-runner";
import ArgumentParser from "../core/argument-parser";

// TODO: Change Scriptwise System to pass in the scripts directly instead of a list of directories
// TODO: Rename scriptwise system to something... other than a system

export default class ScriptCollection {
    public scriptRunner: ScriptRunner;
    private _prebuiltScripts: {[name: string]: Script};
    constructor(prebuiltScripts: {[name: string]: string}, addIns?: {[s: string]: object}) {
        this.scriptRunner = new ScriptRunner();
        this._prebuiltScripts = this.scriptRunner.runManySync(
            this.scriptRunner.buildManySync(prebuiltScripts),
            {},
            addIns
        );
    }
    public getScripts() {
        return Object.keys(this._prebuiltScripts).map((key) => [key, this._prebuiltScripts[key]] as [string, Script]);
    }
    // TODO: Consider having the prebuilt modules in runScript use something other than just the collection's
    // prebuilt scripts, it may be a good idea to only include what's absolutely necessary
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
    public buildScripts(
            pathsWithCode: {[s: string]: string},
            moduleDependencyHandler?: (specifier: string, referrer: IVM.Module) => [string, string] | undefined) {
        return this.scriptRunner.buildManySync(
            pathsWithCode,
            moduleDependencyHandler
        );
    }
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
    public convert(obj: any) {
        return new IVM.ExternalCopy(obj).copyInto();
    }
    public execute(scriptPath: string, name: string, params: any[] = [], timeout: number = 500) {
        const script = this.getScript(scriptPath);
        return script.execute(name, params, timeout);
    }
    public async executeAsync(scriptPath: string, name: string, params: any[] = [], timeout: number = 500) {
        const script = this.getScript(scriptPath);
        return await script.executeAsync(name, params, timeout);
    }
    public executeReturnRef(scriptPath: string, name: string, ...params: any) {
        const funcRef = this.getScript(scriptPath).getReference(name);
        const context = this.getScript(scriptPath).context;
        const script = `
            export function run(func, ...args) {return new IVM.Reference(func(...args))};
        `;
        const tmpScript = this.scriptRunner.buildSync(script, {IVM}, undefined, context);
        const res = tmpScript.execute("run", [funcRef.derefInto(), ...params]);
        if (res.typeof === "undefined") {
            console.log("ref is undefined");
            return undefined;
        }
        return res;
    }
    public get(scriptPath: string, name: string): any {
        const script = this.getScript(scriptPath);
        return script.get(name);
    }
    public runIVMScript(scriptPath: string, script: string) {
        const context = this.getScript(scriptPath).context;
        return this.scriptRunner.buildSync(script, {IVM}, undefined, context);
    }
    public getScript(scriptPath: string) {
        const script = this._prebuiltScripts[scriptPath];
        return script;
    }
}
