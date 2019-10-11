import _Manager from "core/manager";
import Player from "core/player";
import PlayerGroup, { PlayerGroupType } from "core/player-group";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerMessageBroadcaster from "networking/server-messages/server-message-broadcaster";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";

jest.mock("core/manager");
// tslint:disable-next-line: variable-name
const PlayerManager = _Manager as jest.Mock<_Manager<Player>>;

let playerMap!: Map<string, Player>;
let mockManager!: _Manager<Player>;
let serverMessageBroadcaster!: ServerMessageBroadcaster;

beforeEach(() => {
    mockManager = new PlayerManager();
    serverMessageBroadcaster = new ServerMessageBroadcaster(mockManager);
    playerMap = new Map<string, Player>([
        ["player2id", new Player("player2id", 2, "player2", "Player 2")],
        ["player4id", new Player("player4id", 4, "player4", "Player 4")],
        ["player5id", new Player("player5id", 5, "player5", "Player 5")],
        ["player6id", new Player("player6id", 6, "player6", "Player 6")],
        ["player7id", new Player("player7id", 7, "player7", "Player 7")]
    ]);
    mockManager.entries = jest.fn(() => {
        return playerMap.entries();
    });
});

describe("ServerMessageBroadcaster", () => {
    test("can broadcast to all", () => {
        const callback = jest.fn((clientID, messageToSend) => {});
        const event = new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket("test"));
        const message = new ServerMessage(
            event,
            new PlayerGroup(PlayerGroupType.All, [])
        );
        serverMessageBroadcaster.setPacketCallback(callback);
        serverMessageBroadcaster.addToQueue(message);
        serverMessageBroadcaster.sendMessages();
        expect(callback.mock.calls.length).toEqual(5);
        expect(callback.mock.calls.sort()).toEqual([
            [2, event],
            [4, event],
            [5, event],
            [6, event],
            [7, event]
        ].sort());
    });

    test("can broadcast to one", () => {
        const callback = jest.fn((clientID, messageToSend) => {});
        const event = new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket("test"));
        const message = new ServerMessage(
            event,
            new PlayerGroup(PlayerGroupType.Only, [new Player("player5id", 5, "player5", "Player 5")])
        );
        serverMessageBroadcaster.setPacketCallback(callback);
        serverMessageBroadcaster.addToQueue(message);
        serverMessageBroadcaster.sendMessages();
        expect(callback.mock.calls.length).toEqual(1);
        expect(callback.mock.calls.sort()).toEqual([
            [5, event],
        ].sort());
    });

    test("can broadcast to some", () => {
        const callback = jest.fn((clientID, messageToSend) => {});
        const event = new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket("test"));
        const message = new ServerMessage(
            event,
            new PlayerGroup(PlayerGroupType.Only, [
                new Player("player5id", 5, "player5", "Player 5"),
                new Player("player4id", 4, "player4", "Player 4")
            ])
        );
        serverMessageBroadcaster.setPacketCallback(callback);
        serverMessageBroadcaster.addToQueue(message);
        serverMessageBroadcaster.sendMessages();
        expect(callback.mock.calls.length).toEqual(2);
        expect(callback.mock.calls.sort()).toEqual([
            [4, event],
            [5, event]
        ].sort());
    });

    test("can broadcast to all but one", () => {
        const callback = jest.fn((clientID, messageToSend) => {});
        const event = new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket("test"));
        const message = new ServerMessage(
            event,
            new PlayerGroup(PlayerGroupType.Except, [new Player("player5id", 5, "player5", "Player 5")])
        );
        serverMessageBroadcaster.setPacketCallback(callback);
        serverMessageBroadcaster.addToQueue(message);
        serverMessageBroadcaster.sendMessages();
        expect(callback.mock.calls.length).toEqual(4);
        expect(callback.mock.calls.sort()).toEqual([
            [2, event],
            [4, event],
            [6, event],
            [7, event]
        ].sort());
    });
});
