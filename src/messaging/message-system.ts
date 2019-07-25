import Player from "core/players/player";
import System from "core/systems/system";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
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
    private _messageSendCallback: ((s: ServerMessage) => void) | undefined;
    private _inputCollection: Map<number, string>;

    constructor() {
        super();
        this._inputCollection = new Map<number, string>();
        this.inputDelegate = this.inputDelegate.bind(this);
    }
    public parseInput(client: Player, key: number) {
        console.log("Received key " + key + " from Player " + client.id);
        let currMessage = this._inputCollection.get(client.id);
        if (currMessage === undefined) {
            currMessage = "";
        }
        switch (key) {
            case 48: case 96:
                currMessage += "0";
                break;
            case 49: case 97:
                currMessage += "1";
                break;
            case 50: case 98:
                currMessage += "2";
                break;
            case 51: case 99:
                currMessage += "3";
                break;
            case 52: case 100:
                currMessage += "4";
                break;
            case 53: case 101:
                currMessage += "5";
                break;
            case 54: case 102:
                currMessage += "6";
                break;
            case 55: case 103:
                currMessage += "7";
                break;
            case 56: case 104:
                currMessage += "8";
                break;
            case 57: case 105:
                currMessage += "9";
                break;
            case 65:
                currMessage += "A";
                break;
            case 66:
                currMessage += "B";
                break;
            case 67:
                currMessage += "C";
                break;
            case 68:
                currMessage += "D";
                break;
            case 69:
                currMessage += "E";
                break;
            case 70:
                currMessage += "F";
                break;
            case 13:
                this.sendMessage(currMessage);
                currMessage = "";
                break;
        }
        this._inputCollection.set(client.id, currMessage);
    }
    public sendMessage(message: string) {
        console.log("Sending message " + message);
        this._messageSendCallback!(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket(message)),
                new MessageRecipient(MessageRecipientType.All, [])
            )
        );
    }
    public onMessageSend(callback: (s: ServerMessage) => void) {
        this._messageSendCallback = callback;
    }
    public inputDelegate(packet: ClientKeyboardInputPacket, player: Player | undefined) {
        this.parseInput(player!, packet.key);
    }
}
