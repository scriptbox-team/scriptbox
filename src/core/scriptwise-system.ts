import fs from "fs";
import IVM from "isolated-vm";
import _ from "lodash";
import path from "path";
import Script from "scripting/script";
import ScriptRunner from "scripting/script-runner";

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
        return this.scriptRunner.executeSync(script, {IVM}, context);
    }
    private getModule(modulePath: string) {
        const module = this._prebuiltScripts[modulePath];
        if (module === undefined) {
            throw new Error("Module at path " + modulePath + " could not be found.");
        }
        return module;
    }
}
