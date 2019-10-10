import Player from "core/player";
import PlayerGroup, { PlayerGroupType } from "core/player-group";
import MessageSystem from "core/systems/message-system";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";

// Note: These imported classes are only really used for data purposes
// Their functionality is not used in this class

let messageSystem!: MessageSystem;
const messageSendCallback = jest.fn((message: string, playerGroup: PlayerGroup) => {});
const scriptExecutionCallback = jest.fn((script: string) => Promise.resolve());
const testPlayer = new Player("player0ID", 0, "Player0", "Player 0");

beforeEach(() => {
    messageSystem = new MessageSystem();
    messageSystem.onMessageSend(messageSendCallback);
    messageSystem.onScriptExecution(scriptExecutionCallback);
});

test("MessageSystem::Simple Message", () => {
    messageSystem.receiveChatMessage("test message", testPlayer);
    expect(messageSendCallback.mock.calls.length).toEqual(1);
    expect(messageSendCallback.mock.calls[0][0]).toEqual("Player 0: test message");
    expect(messageSendCallback.mock.calls[0][1]).toEqual(new PlayerGroup(PlayerGroupType.All, []));
});
