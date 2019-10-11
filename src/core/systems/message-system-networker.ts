import Player from "core/player";
import PlayerGroup, { PlayerGroupType } from "core/player-group";
import MessageSystem from "core/systems/message-system";
import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ServerChatMessagePacket from "networking/packets/server-chat-message-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";

export default class MessageSystemNetworker extends Networker {
    private _messageSystem: MessageSystem;
    constructor(messageSystem: MessageSystem) {
        super();
        this.connectionDelegate = this.connectionDelegate.bind(this);
        this.disconnectionDelegate = this.disconnectionDelegate.bind(this);
        this.clientChatMessageDelegate = this.clientChatMessageDelegate.bind(this);

        this.chatMessageSend = this.chatMessageSend.bind(this);

        this._messageSystem = messageSystem;
        this._messageSystem.onMessageSend(this.chatMessageSend);
    }
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.connectionDelegate);
        netEventHandler.addDisconnectionDelegate(this.disconnectionDelegate);
        netEventHandler.addChatMessageDelegate(this.clientChatMessageDelegate);
    }
    public connectionDelegate(packet: ClientConnectionPacket, player: Player) {
        this._messageSystem.broadcastMessage(`${player.displayName} connected.`);
        this._messageSystem.outputConsoleMessage(`${player.displayName} connected.`);
    }
    public disconnectionDelegate(
            packet: ClientDisconnectPacket,
            player: Player) {
        this._messageSystem.broadcastMessage(`${player.displayName} disconnected.`);
        this._messageSystem.outputConsoleMessage(`${player.displayName} disconnected.`);
    }
    public clientChatMessageDelegate(packet: ClientChatMessagePacket, player: Player) {
        this._messageSystem.chatMessageDelegate(packet, player);
    }
    public chatMessageSend(message: string, players: PlayerGroup) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.ChatMessage, new ServerChatMessagePacket(message)),
                players
            )
        );
    }
}
