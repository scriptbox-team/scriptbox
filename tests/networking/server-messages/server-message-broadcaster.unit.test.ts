import ServerMessageBroadcaster from "networking/server-messages/server-message-broadcaster";

import Player from "core/players/player";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import _PlayerNetworkManager from "networking/player-network-manager";
import ServerMessage from "networking/server-messages/server-message";
import { MessageRecipient, MessageRecipientType } from "networking/server-messages/server-message-recipient";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";

jest.mock("networking/player-network-manager");
// tslint:disable-next-line: variable-name
const PlayerNetworkManager = _PlayerNetworkManager as jest.Mock<_PlayerNetworkManager>;

import _PlayerManagerInterface from "core/players/player-manager-interface";
jest.mock("core/players/player-manager-interface");
// tslint:disable-next-line: variable-name
const PlayerManagerInterface = _PlayerManagerInterface as jest.Mock<_PlayerManagerInterface>;

let serverMessageBroadcaster!: ServerMessageBroadcaster;
const mockManager = new PlayerNetworkManager();

beforeEach(() => {
    serverMessageBroadcaster = new ServerMessageBroadcaster(mockManager);
    PlayerNetworkManager.mock.instances[0].getConnectedPlayers = () => {
        return [
           0,
           1,
           2,
           4
        ];
    };
    PlayerNetworkManager.mock.instances[0].getClientIDFromPlayerID = (id) => {
        return [2, 4, 5, 6, 7][id];
    };
    PlayerNetworkManager.mock.instances[0].getClientIDFromPlayer = (player: Player) => {
        return [2, 4, 5, 6, 7][player.id];
    };
});

describe("ServerMessageBroadcaster", () => {
    test("can broadcast to all", () => {
        const callback = jest.fn((clientID, messageToSend) => {});
        const event = new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket("test"));
        const message = new ServerMessage(
            event,
            new MessageRecipient(MessageRecipientType.All, [])
        );
        serverMessageBroadcaster.setPacketCallback(callback);
        serverMessageBroadcaster.addToQueue(message);
        serverMessageBroadcaster.sendMessages();
        expect(callback.mock.calls.length).toEqual(4);
        expect(callback.mock.calls.sort()).toEqual([
            [2, event],
            [4, event],
            [5, event],
            [7, event]
        ].sort());
    });

    test("can broadcast to one", () => {
        const callback = jest.fn((clientID, messageToSend) => {});
        const event = new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket("test"));
        const message = new ServerMessage(
            event,
            new MessageRecipient(MessageRecipientType.Only, [new Player(2, new PlayerManagerInterface())])
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
            new MessageRecipient(MessageRecipientType.Only, [
                new Player(2, new PlayerManagerInterface()),
                new Player(1, new PlayerManagerInterface())
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
            new MessageRecipient(MessageRecipientType.Except, [new Player(2, new PlayerManagerInterface())])
        );
        serverMessageBroadcaster.setPacketCallback(callback);
        serverMessageBroadcaster.addToQueue(message);
        serverMessageBroadcaster.sendMessages();
        expect(callback.mock.calls.length).toEqual(3);
        expect(callback.mock.calls.sort()).toEqual([
            [2, event],
            [4, event],
            [7, event]
        ].sort());
    });
});
