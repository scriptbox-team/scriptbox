import Client from "core/client";
import Group, { GroupType } from "core/group";
import _Manager from "core/manager";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerMessageBroadcaster from "networking/server-messages/server-message-broadcaster";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";

jest.mock("core/manager");
// tslint:disable-next-line: variable-name
const PlayerManager = _Manager as jest.Mock<_Manager<Client>>;

let playerMap!: Map<string, Client>;
let mockManager!: _Manager<Client>;
let serverMessageBroadcaster!: ServerMessageBroadcaster;

beforeEach(() => {
    mockManager = new PlayerManager();
    serverMessageBroadcaster = new ServerMessageBroadcaster(mockManager);
    playerMap = new Map<string, Client>([
        ["player2id", new Client("player2id", 2, "player2", "Player 2")],
        ["player4id", new Client("player4id", 4, "player4", "Player 4")],
        ["player5id", new Client("player5id", 5, "player5", "Player 5")],
        ["player6id", new Client("player6id", 6, "player6", "Player 6")],
        ["player7id", new Client("player7id", 7, "player7", "Player 7")]
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
            new Group(GroupType.All, [])
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
            new Group(GroupType.Only, [new Client("player5id", 5, "player5", "Player 5")])
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
            new Group(GroupType.Only, [
                new Client("player5id", 5, "player5", "Player 5"),
                new Client("player4id", 4, "player4", "Player 4")
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
            new Group(GroupType.Except, [new Client("player5id", 5, "player5", "Player 5")])
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
