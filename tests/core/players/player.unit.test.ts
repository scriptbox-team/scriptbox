import Player from "core/player";

let player!: Player;

beforeEach(() => {
    player = new Player("testPlayerID", 1, "testPlayer", "Test Player");
});

describe("Player", () => {
    test("can convert input", () => {
        player.controlSet = {
            38: "up",
            40: "down",
            37: "left",
            39: "right"
        };
        const convertedInput = player.convertInput(38);
        expect(convertedInput).toEqual("up");
    });

    test("will return undefined on converting unknown input", () => {
        player.controlSet = {
            38: "up",
            40: "down",
            37: "left",
            39: "right"
        };
        const convertedInput = player.convertInput(41);
        expect(convertedInput).toEqual(undefined);
    });
});
