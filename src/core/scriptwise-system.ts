import fs from "fs";
import IVM from "isolated-vm";
import _ from "lodash";
import path from "path";
import Script from "scripting/script";
import ScriptRunner from "scripting/script-runner";
import ArgumentParser from "./argument-parser";

// TODO: Change Scriptwise System to pass in the scripts directly instead of a list of directories
// TODO: Rename scriptwise system to something... other than a system

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
    public async runPlayerScript(code: string, args: string, thisValue?: IVM.Reference<any>) {
        const argsArray = ArgumentParser.parse(args);
        return this.scriptRunner.build(
            code,
            {args: argsArray, thisEntity: thisValue === undefined ? undefined : thisValue.derefInto()},
            undefined,
            undefined,
            500,
            this._prebuiltScripts
        );
    }
    public execute(componentPath: string, name: string, ...params: any) {
        const component = this.getComponent(componentPath);
        return component.execute(name, ...params);
    }
    public executeReturnRef(componentPath: string, name: string, ...params: any) {
        const funcRef = this.getComponent(componentPath).getReference(name);
        const context = this.getComponent(componentPath).context;
        const script = `
            export function run(func, ...args) {return new IVM.Reference(func(args))};
        `;
        const tmpComponent = this.scriptRunner.buildSync(script, {IVM}, undefined, context);
        const res = tmpComponent.execute("run", ...[funcRef.derefInto(), ...params]);
        if (res.typeof === "undefined") {
            return undefined;
        }
        return res;
    }
    public get(componentPath: string, name: string): any {
        const component = this.getComponent(componentPath);
        return component.get(name);
    }
    public runPostScript(componentPath: string, script: string) {
        const context = this.getComponent(componentPath).context;
        return this.scriptRunner.buildSync(script, {IVM}, undefined, context);
    }
    private getComponent(componentPath: string) {
        const component = this._prebuiltScripts[componentPath];
        if (component === undefined) {
            throw new Error("Component at path " + componentPath + " could not be found.");
        }
        return component;
    }
}
