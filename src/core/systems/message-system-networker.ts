import Client from "core/client";
import Group, { GroupType } from "core/group";
import MessageSystem from "core/systems/message-system";
import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";

/**
 * Interfaces between MessageSystem and the networking components of the program.
 * This takes incoming packets and calls the associated functions in the system, and receives
 * callbacks from MessageSystem to send outgoing packets.
 *
 * @export
 * @class MessageSystemNetworker
 * @extends {Networker}
 * @module core
 */
export default class MessageSystemNetworker extends Networker {
    private _messageSystem: MessageSystem;
    /**
     * Creates an instance of MessageSystemNetworker.
     * @param {MessageSystem} messageSystem
     * @memberof MessageSystemNetworker
     */
    constructor(messageSystem: MessageSystem) {
        super();
        this.connectionDelegate = this.connectionDelegate.bind(this);
        this.disconnectionDelegate = this.disconnectionDelegate.bind(this);
        this.clientChatMessageDelegate = this.clientChatMessageDelegate.bind(this);

        this.chatMessageSend = this.chatMessageSend.bind(this);

        this._messageSystem = messageSystem;
        this._messageSystem.onMessageSend(this.chatMessageSend);
    }
    /**
     * Adds input delegates to a NetEventHandler
     * @param {NetEventHandler} netEventHandler the NetEventHandler to add the delegates to.
     * @memberof MessageSystemNetworker
     */
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.connectionDelegate);
        netEventHandler.addDisconnectionDelegate(this.disconnectionDelegate);
        netEventHandler.addChatMessageDelegate(this.clientChatMessageDelegate);
    }
    /**
     * A delegate which tells the message system to output a connection message when a player connects.
     *
     * @param {ClientConnectionPacket} packet The connection packet
     * @param {Client} player The client of the connection packet
     * @memberof MessageSystemNetworker
     */
    public connectionDelegate(packet: ClientConnectionPacket, player: Client) {
        this._messageSystem.broadcastMessage(`${player.displayName} connected.`);
        this._messageSystem.outputConsoleMessage(`${player.displayName} connected.`);
    }
    /**
     * A delegate which tells the message system to output a disconnection message when a player disconnects.
     *
     * @param {ClientDisconnectPacket} packet The disconnection packet
     * @param {Client} player The client of the disconnection packet
     * @memberof MessageSystemNetworker
     */
    public disconnectionDelegate(
            packet: ClientDisconnectPacket,
            player: Client) {
        this._messageSystem.broadcastMessage(`${player.displayName} disconnected.`);
        this._messageSystem.outputConsoleMessage(`${player.displayName} disconnected.`);
    }
    /**
     * A delegate which passes a chat message to the MessageSystem to be handled.
     *
     * @param {ClientChatMessagePacket} packet The chat message packet
     * @param {Client} player The client of the chat message packet
     * @memberof MessageSystemNetworker
     */
    public clientChatMessageDelegate(packet: ClientChatMessagePacket, player: Client) {
        this._messageSystem.receiveChatMessage(packet.message, player!);
    }
    /**
     * A callback that is executed when the MessageSystem wants to send a message
     *
     * @param {string} message The message to send
     * @param {Group<Client>} players The player group to send the message to
     * @memberof MessageSystemNetworker
     */
    public chatMessageSend(message: string, players: Group<Client>) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket(message)),
                players
            )
        );
    }
}
