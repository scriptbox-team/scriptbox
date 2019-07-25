import IVM from "isolated-vm";

export default class Script {
    public context: IVM.Context;
    private _module: IVM.Module;
    constructor(module: IVM.Module, context: IVM.Context) {
        this._module = module;
        this.context = context;
    }
    public execute(name: string, ...params: any) {
        const module = this._module;
        const funcRef = module.namespace.getSync(name);
        if (funcRef.typeof !== "function") {
            throw new Error("Function \"" + name + "\" not found in script.");
        }
        return funcRef.applySync(undefined, params);
    }
    public get(name: string): any {
        const module = this._module;
        const funcRef = module.namespace.getSync(name);
        if (funcRef.typeof !== "undefined") {
            throw new Error("Reference \"" + name + "\" not found in script.");
        }
        return funcRef.copySync();
    }
    public release() {
        this.context.release();
    }
}
