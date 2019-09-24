import ScriptRunner from "scripting/script-runner";

// Test whether we can execute code
test("ScriptExecutor::run\tBase Case", async () => {
    const se = new ScriptRunner();
    const script = `
        20 * 52;
    `;
    const result = (await se.build(script)).result;
    expect(result).toBe(1040);
});

// Test whether we can build a module and instantiate it
test("ScriptExecutor::build\tBase Case", async () => {
    const se = new ScriptRunner();
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
    const def = await ref.getReference("default")!;

    const result = (await se.build(instantiationTest, {Test: def.derefInto()})).result;
    expect(result).toEqual(5);
});
