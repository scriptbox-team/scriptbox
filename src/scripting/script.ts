import IVM from "isolated-vm";

export default class Script {
    public context: IVM.Context;
    public result: any;
    public module: IVM.Module;
    constructor(module: IVM.Module, context: IVM.Context, result: any) {
        this.module = module;
        this.context = context;
        this.result = result;
    }
    public execute(name: string, ...params: any) {
        const module = this.module;
        const funcRef = module.namespace.getSync(name);
        if (funcRef.typeof !== "function") {
            throw new Error("Function \"" + name + "\" not found in script.");
        }
        return funcRef.applySync(undefined, params, {timeout: 500});
    }
    public async executeNoReturn(name: string, ...params: any) {
        const module = this.module;
        const funcRef = module.namespace.getSync(name);
        if (funcRef.typeof !== "function") {
            throw new Error("Function \"" + name + "\" not found in script.");
        }
        return funcRef.applyIgnored(undefined, params, {timeout: 500});
    }
    public get(name: string): any {
        const module = this.module;
        const funcRef = module.namespace.getSync(name);
        if (funcRef.typeof === "undefined") {
            return undefined;
        }
        return funcRef.copySync();
    }
    public getReference(name: string): IVM.Reference<any> {
        const module = this.module;
        const funcRef = module.namespace.getSync(name);
        return funcRef;
    }
    public release() {
        this.context.release();
    }
}
