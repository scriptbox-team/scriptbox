import IVM from "isolated-vm";

export default class Script {
    public context: IVM.Context;
    public result: any;
    private _module: IVM.Module;
    constructor(module: IVM.Module, context: IVM.Context, result: any) {
        this._module = module;
        this.context = context;
        this.result = result;
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
        if (funcRef.typeof === "undefined") {
            return undefined;
        }
        return funcRef.copySync();
    }
    public getReference(name: string): IVM.Reference<any> {
        const module = this._module;
        const funcRef = module.namespace.getSync(name);
        return funcRef;
    }
    public release() {
        this.context.release();
    }
}
