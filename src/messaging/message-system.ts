import Player from "core/players/player";
import System from "core/systems/system";
import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import ServerMessage from "networking/server-messages/server-message";
import { MessageRecipient, MessageRecipientType } from "networking/server-messages/server-message-recipient";
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
    private _messageSendCallback?: ((s: ServerMessage) => void);
    private _scriptExecutionCallback?: (script: string) => Promise<any>;

    constructor() {
        super();
        this.chatMessageDelegate = this.chatMessageDelegate.bind(this);
    }
    public receiveChatMessage(message: string, owner: Player) {
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
                let scriptShort = script;
                if (scriptShort.length > 50) {
                    scriptShort = scriptShort.substr(0, 50) + "...";
                }
                this._scriptExecutionCallback!(script)
                    .then((result: any) => {
                        this.sendMessageToPlayer("<\'" + scriptShort + "\' result: " + result + ">", owner);
                    })
                    .catch((err: Error) => {
                        this.sendMessageToPlayer("<" + err.name + ": " + err.message + ">", owner);
                    });
            }
        }
        else {
            // Regular chat message
            this.broadcastMessage(owner.displayName + ": " + message);
        }
    }
    public broadcastMessage(message: string) {
        this._messageSendCallback!(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket(message)),
                new MessageRecipient(MessageRecipientType.All, [])
            )
        );
    }
    public sendMessageToPlayer(message: string, recipient: Player) {
        this._messageSendCallback!(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket(message)),
                new MessageRecipient(MessageRecipientType.Only, [recipient])
            )
        );
    }
    public outputErrorToPlayer(error: any, recipient: Player) {
        this.sendMessageToPlayer(`Error: ${error}`, recipient);
        if (error.stack !== undefined) {
            this.sendMessageToPlayer(`Stack Trace: ${error.stack}`, recipient);
        }
    }
    public onMessageSend(callback: (s: ServerMessage) => void) {
        this._messageSendCallback = callback;
    }
    public onScriptExecution(callback: (code: string) => Promise<any>) {
        this._scriptExecutionCallback = callback;
    }
    public chatMessageDelegate(packet: ClientChatMessagePacket, player: Player | undefined) {
        this.receiveChatMessage(packet.message, player!);
    }
}
