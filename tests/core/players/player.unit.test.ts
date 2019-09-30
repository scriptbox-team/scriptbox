import Player from "core/players/player";

import _PlayerManagerInterface from "core/players/player-manager-interface";
jest.mock("core/players/player-manager-interface");
// tslint:disable-next-line: variable-name
const PlayerManagerInterface = _PlayerManagerInterface as jest.Mock<_PlayerManagerInterface>;

let player!: Player;

beforeEach(() => {
    PlayerManagerInterface.mockReset();
    player = new Player(0, new PlayerManagerInterface());
});

test("Player::Get Username::Standard Case", () => {
    const a = player.username;
    const instance = PlayerManagerInterface.mock.instances[0];
    expect((instance.getUsername as any).mock.calls.length).toEqual(1);
});

test("Player::Get and Set Display Name::Standard Case", () => {
    player.displayName = "b";
    const a = player.displayName;
    const instance = PlayerManagerInterface.mock.instances[0];
    expect((instance.setDisplayName as any).mock.calls.length).toEqual(1);
    expect((instance.getDisplayName as any).mock.calls.length).toEqual(1);
});
