import PlayerManager from "core/player-manager";

import _Player from "core/player";
jest.mock("core/player");
// tslint:disable-next-line: variable-name
const Player = _Player as jest.Mock<_Player>;

import _PlayerManagerInterface from "core/player-manager-interface";
jest.mock("core/player-manager-interface");
// tslint:disable-next-line: variable-name
const PlayerManagerInterface = _PlayerManagerInterface as jest.Mock<_PlayerManagerInterface>;

// TODO: Refactor "manager" classes to be more generic and less state-dependent
// TODO: Add more player manager tests after refactoring the class

let pm!: PlayerManager;

interface IPlayerData {
    username: string;
    displayName: string;
    controllingEntity: number | null;
}

beforeEach(() => {
    pm = new PlayerManager();
    prepareState(pm);
    Player.mockReset();
    PlayerManagerInterface.mockReset();
});

const prepareState = (playerManager: PlayerManager) => {
    const editablePM = playerManager as any;
    editablePM._players = new Map<number, IPlayerData>([
        [0, {username: "player1", displayName: "Player 1", controllingEntity: null}],
        [1, {username: "player2", displayName: "Player 2", controllingEntity: null}],
        [2, {username: "player3", displayName: "Player 3", controllingEntity: null}]
    ]);
    editablePM._playerIDByUsername = new Map<string, number>([
        ["player1", 0],
        ["player2", 1],
        ["player3", 2]
    ]);
    editablePM._nextPlayerID = 3;
};

test("PlayerManager::Player Creation::Standard Case", () => {
    const player = pm.createPlayer({
        username: "test",
        displayName: "Testy guy",
        controllingEntity: null
    });
    expect((pm as any)._players).toEqual(new Map<number, IPlayerData>([
        [0, {username: "player1", displayName: "Player 1", controllingEntity: null}],
        [1, {username: "player2", displayName: "Player 2", controllingEntity: null}],
        [2, {username: "player3", displayName: "Player 3", controllingEntity: null}],
        [3, {username: "test", displayName: "Testy guy", controllingEntity: null}]
    ]));
});

test("PlayerManager::Player Existence::Standard Case", () => {
    const player = pm.createPlayer({
        username: "test",
        displayName: "Testy guy",
        controllingEntity: null
    });
    const id = Player.mock.calls[0][0];
    expect(pm.playerExists(id)).toBeTruthy();
});

test("PlayerManager::Get Player IDs::Standard Case", () => {
    const testIDs = [0, 1, 2];
    const ids = pm.getPlayerIDs();
    expect(ids).toEqual(testIDs);
});

test("PlayerManager::Convert ID to Player object::Standard Case", () => {
    const player = pm.createPlayer({
        username: "test",
        displayName: "Testy guy",
        controllingEntity: null
    });
    const id = Player.mock.calls[0][0];
    const playerCopy = pm.idToPlayerObject(id);
    expect(Player.mock.calls[0][0]).toBe(Player.mock.calls[1][0]);
    expect(Player.mock.calls[0][1] instanceof PlayerManagerInterface).toBeTruthy();
});
