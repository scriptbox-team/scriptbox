import Client from "core/client";
import Group, { GroupType } from "core/group";
import MessageSystem from "core/systems/message-system";

let messageSystem!: MessageSystem;
const messageSendCallback = jest.fn((message: string, clientGroup: Group<Client>) => {});
const scriptExecutionCallback = jest.fn((script: string) => Promise.resolve());
const testPlayer = new Client("player0ID", 0, "Player0", "Player 0");

beforeEach(() => {
    messageSystem = new MessageSystem();
    messageSystem.onMessageSend(messageSendCallback);
    messageSystem.onScriptExecution(scriptExecutionCallback);
});

test("MessageSystem::Simple Message", () => {
    messageSystem.receiveChatMessage("test message", testPlayer);
    expect(messageSendCallback.mock.calls.length).toEqual(1);
    expect(messageSendCallback.mock.calls[0][0]).toEqual("Player 0: test message");
    expect(messageSendCallback.mock.calls[0][1]).toEqual(new Group(GroupType.All, []));
});
