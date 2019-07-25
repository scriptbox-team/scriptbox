/* tslint:disable */
import "./fix-test-paths";
import ScriptExecutor from "scripting/script-executor";
import IVM from "isolated-vm";
/* tslint:enable */

// Test whether we can execute code
test("ScriptExecutor::run\tBase Case", async () => {
    const se = new ScriptExecutor();
    const script = `
        20 * 52;
    `;
    const result = await se.execute(script);
    expect(result).toBe(1040);
});

// Test whether we can build a module and instantiate it
test("ScriptExecutor::build\tBase Case", async () => {
    const se = new ScriptExecutor();
    const module = `
        let y = 0;
        export default class Test {
            private _x: number;
            constructor(x) {
                this._x = x;
            }
            public addY(num) {
                y += num;
            }
            public getY(): number {
                return y;
            }
            public getX(): number {
                return this._x;
            }
        }
    `;
    const instantiationTest = `
        const test = new Test(2);
        test.addY(test.getX());
        test.addY(3);
        test.getY();
    `;
    const ref = await se.build(module);
    const def = await ref.namespace.get("default");

    const result = await se.execute(instantiationTest, {Test: def.derefInto()});
    expect(result).toEqual(5);
});
