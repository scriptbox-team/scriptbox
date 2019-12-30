import Client from "core/client";
import Group, { GroupType } from "core/group";
import System from "core/systems/system";
import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";

/**
 * A system of the server which handles receiving and sending messages to and from the
 * chat window. This will also parse incoming commands for particular actions and execute
 * those actions either directly or through callbacks.
 *
 * @export
 * @class MessageSystem
 * @extends {System}
 * @module core
 */
export default class MessageSystem extends System {
    private _messageSendCallback?: (message: string, group: Group<Client>) => void;
    private _scriptExecutionCallback?: (script: string, player: Client) => void;
    /**
     * Creates an instance of MessageSystem.
     * @memberof MessageSystem
     */
    constructor() {
        super();
    }
    /**
     * Handle a chat message received from a player.
     * This will handle commands appropriately if the message is a command.
     *
     * @param {string} message The message to be handled
     * @param {Client} owner The sender of the chat message
     * @memberof MessageSystem
     */
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
    /**
     * Send a chat message to all of the clients.
     *
     * @param {string} message The message to send.
     * @memberof MessageSystem
     */
    public broadcastMessage(message: string) {
        this._messageSendCallback!(message, new Group(GroupType.All, []));
    }
    /**
     * Send a chat message to one client
     *
     * @param {string} message The message to send.
     * @param {Client} recipient The client to send the message to.
     * @memberof MessageSystem
     */
    public sendMessageToPlayer(message: string, recipient: Client) {
        this._messageSendCallback!(message, new Group(GroupType.Only, [recipient]));
    }
    /**
     * Output an error message to one client.
     *
     * @param {*} error The error to send.
     * @param {Client} recipient The client to receive the erorr.
     * @memberof MessageSystem
     */
    public outputErrorToPlayer(error: any, recipient: Client) {
        this.sendMessageToPlayer(`Error: ${error}`, recipient);
        if (error.stack !== undefined) {
            this.sendMessageToPlayer(`Stack Trace: ${error.stack}`, recipient);
        }
    }
    /**
     * Set the callback to execute when a message is sent.
     *
     * @param {(message: string, group: Group<Client>) => void} callback The callback.
     * @memberof MessageSystem
     */
    public onMessageSend(callback: (message: string, group: Group<Client>) => void) {
        this._messageSendCallback = callback;
    }
    /**
     * Set the callback to execute when a script is run from the chat.
     *
     * @param {(code: string, player: Client) => Promise<any>} callback The callback.
     * @memberof MessageSystem
     */
    public onScriptExecution(callback: (code: string, player: Client) => Promise<any>) {
        this._scriptExecutionCallback = callback;
    }
    /**
     * Output a message to the server console.
     *
     * @param {*} message The message to output.
     * @memberof MessageSystem
     */
    public outputConsoleMessage(message: any) {
        console.log(message);
    }
    /**
     * Send an array of exported messages from the GameSystem.
     *
     * @param {Array<{recipient: Group<Client>, message: string, kind: string}>} messages The exported messages to send.
     * @memberof MessageSystem
     */
    public sendChatMessages(messages: Array<{recipient: Group<Client>, message: string, kind: string}>) {
        for (const message of messages) {
            this._messageSendCallback!(message.message, message.recipient);
        }
    }
}
