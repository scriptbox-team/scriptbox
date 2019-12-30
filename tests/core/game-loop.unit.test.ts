import GameLoop from "core/game-loop";

let time: number = 1575511911000;

jest.useFakeTimers();
jest.mock("browser-process-hrtime", () => {
    return (lastTime: [number, number]) => {
        const now = [Math.floor(time / 1000), time % 1000 * 1000000];
        if (!lastTime) {
            return now;
        }
        return [now[0] - lastTime[0], now[1] - lastTime[1]];
    };
});

describe("GameLoop", () => {
    beforeEach(() => {
        time = 1575511911000;
    });
    test("can execute tick repeatedly", () => {
        const fn = jest.fn();
        const loop = new GameLoop(fn, 60);
        loop.start();
        time += 18;
        jest.advanceTimersByTime(18);
        expect(fn).toHaveBeenCalledTimes(1);
        time += 18;
        jest.advanceTimersByTime(18);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
