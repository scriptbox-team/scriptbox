import fs from "fs";
import IVM from "isolated-vm";
import _ from "lodash";
import path from "path";
import Script from "scripting/script";
import ScriptRunner from "scripting/script-runner";
import ArgumentParser from "./argument-parser";

// TODO: Change Scriptwise System to pass in the scripts directly instead of a list of directories

export default class ScriptwiseSystem {
    public scriptRunner: ScriptRunner;
    private _prebuiltScripts: {[s: string]: Script};
    constructor(baseScriptDir: string, relativeFileDirs: string[], addIns?: {[s: string]: object}) {
        this.scriptRunner = new ScriptRunner();
        const scripts: any = _.transform(relativeFileDirs, (result, value) => {
            result[value.substr(0, value.length - 3)] = fs.readFileSync(
                path.join(baseScriptDir, value),
                {encoding: "utf8"});
        }, {} as {[s: string]: string});

        this._prebuiltScripts = this.scriptRunner.buildManySync(scripts, addIns);
    }
    public async runPlayerScript(code: string, args: string) {
        const argsArray = ArgumentParser.parse(args);
        return this.scriptRunner.build(code, {args: argsArray}, undefined, undefined, 500);
    }
    public execute(modulePath: string, name: string, ...params: any) {
        const module = this.getModule(modulePath);
        return module.execute(name, ...params);
    }
    public get(modulePath: string, name: string): any {
        const module = this.getModule(modulePath);
        return module.get(name);
    }
    public runPostScript(modulePath: string, script: string) {
        const context = this.getModule(modulePath).context;
        return this.scriptRunner.buildSync(script, {IVM}, undefined, context);
    }
    private getModule(modulePath: string) {
        const module = this._prebuiltScripts[modulePath];
        if (module === undefined) {
            throw new Error("Module at path " + modulePath + " could not be found.");
        }
        return module;
    }
}
