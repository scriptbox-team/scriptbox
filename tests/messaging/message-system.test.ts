import Player from "core/players/player";
import PlayerManagerInterface from "core/players/player-manager-interface";
import MessageSystem from "messaging/message-system";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import ServerMessage from "networking/server-messages/server-message";
import { MessageRecipient, MessageRecipientType } from "networking/server-messages/server-message-recipient";
import ServerNetEvent, {ServerEventType} from "networking/server-net-event";

// Note: These imported classes are only really used for data purposes
// Their functionality is not used in this class

let messageSystem!: MessageSystem;
const messageSendCallback = jest.fn((s: ServerMessage) => {});
const scriptExecutionCallback = jest.fn((script: string) => Promise.resolve());
const testPlayer = new Player(0, new PlayerManagerInterface(
    (id: number) => ({username: "testPlayer", displayName: "Test Player"}), () => {})
);

beforeEach(() => {
    messageSystem = new MessageSystem();
    messageSystem.onMessageSend(messageSendCallback);
    messageSystem.onScriptExecution(scriptExecutionCallback);
});

test("MessageSystem::Simple Message", () => {
    messageSystem.receiveChatMessage("test message", testPlayer);
    expect(messageSendCallback.mock.calls.length).toEqual(1);
    expect(messageSendCallback.mock.calls[0][0]).toEqual(
        new ServerMessage(
            new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket("Test Player: test message")),
            new MessageRecipient(MessageRecipientType.All, [])
        )
    );
});
