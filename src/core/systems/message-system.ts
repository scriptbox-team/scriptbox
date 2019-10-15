import Client from "core/client";
import Group, { GroupType } from "core/group";
import System from "core/systems/system";
import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";

/**
 * A system for managing chat messages sent over the server.
 * Currently has debug behaviour.
 *
 * @export
 * @class MessageSystem
 * @extends {System}
 */
export default class MessageSystem extends System {
    private _messageSendCallback?: (message: string, group: Group<Client>) => void;
    private _scriptExecutionCallback?: (script: string, player: Client) => void;

    constructor() {
        super();
        this.chatMessageDelegate = this.chatMessageDelegate.bind(this);
    }
    public receiveChatMessage(message: string, owner: Client) {
        if (message.charAt(0) === "/") {
            // Chat command
            const cmd = message.substr(1, message.length - 1).split(/\s+/);
            switch (cmd[0]) {
                case "nick": {
                    if (cmd.length > 1) {
                        this.broadcastMessage(
                            "(" + owner.displayName + " changed their name to " + cmd[1] + ")",
                        );
                        owner.displayName = cmd[1];
                    }
                    break;
                }
            }

        }
        else if (message.substr(0, 2) === ">>") {
            // Script execution
            const cmd = message.match(/^>>\s*(.*)$/);
            if (cmd !== null) {
                const script = cmd[1];
                this._scriptExecutionCallback!(script, owner);
            }
        }
        else {
            // Regular chat message
            this.broadcastMessage(owner.displayName + ": " + message);
        }
    }
    public broadcastMessage(message: string) {
        this._messageSendCallback!(message, new Group(GroupType.All, []));
    }
    public sendMessageToPlayer(message: string, recipient: Client) {
        this._messageSendCallback!(message, new Group(GroupType.Only, [recipient]));
    }
    public outputErrorToPlayer(error: any, recipient: Client) {
        this.sendMessageToPlayer(`Error: ${error}`, recipient);
        if (error.stack !== undefined) {
            this.sendMessageToPlayer(`Stack Trace: ${error.stack}`, recipient);
        }
    }
    public onMessageSend(callback: (message: string, group: Group<Client>) => void) {
        this._messageSendCallback = callback;
    }
    public onScriptExecution(callback: (code: string, player: Client) => Promise<any>) {
        this._scriptExecutionCallback = callback;
    }
    public chatMessageDelegate(packet: ClientChatMessagePacket, player: Client | undefined) {
        this.receiveChatMessage(packet.message, player!);
    }
    public outputConsoleMessage(message: any) {
        console.log(message);
    }
    public sendChatMessages(messages: Array<{recipient: Group<Client>, message: string}>) {
        for (const message of messages) {
            this._messageSendCallback!(message.message, message.recipient);
        }
    }
}
