import { EventEmitter } from "events";
import * as http from "http";
import * as WebSocket from "ws";

import ClientNetEvent, { ClientEventType } from "./client-net-event";
import NetClient from "./net-client";
import ClientConnectionTokenPacket from "./packets/client-connection-packet";
import ClientDisconnectPacket from "./packets/client-disconnect-packet";
import ServerConnectionAcknowledgementPacket from "./packets/server-connection-acknowledgement-packet";
import ServerConnectionInfoRequestPacket from "./packets/server-connection-info-request-packet";
import ServerNetEvent, { ServerEventType } from "./server-net-event";

const CONNECTION_INFO_TIMEOUT = 10000; // milliseconds

/**
 * The constructor options for the NetHost
 *
 * @interface NetHostConstructionOptions
 */
interface NetHostConstructionOptions {
    /**
     * The port to open the NetHost on
     *
     * @type {number}
     * @memberof INetHostConstructionOptions
     */
    port: number;
    /**
     * The maximum number of clients to allow
     *
     * @type {number}
     * @memberof INetHostConstructionOptions
     */
    maxClients: number;
}

/**
 * A networking interface which handles sending and receiving packets to and from clients.
 * This uses websockets for network communication.
 *
 * @export
 * @class NetHost
 */
export default class NetHost {
    public resourceServerIPGetter!: (localAddress: string) => string;
    public validateToken!: (username: string, token: string) => Promise<string>;
    private _emitter: EventEmitter;
    private _port: number;
    private _webSocketServer: WebSocket.Server | null;
    private _nextID: number;
    private _clients: Map<number, NetClient>;
    private _validEvents: Set<string | ClientEventType>;
    private _timeoutMap: WeakMap<WebSocket, ReturnType<typeof setTimeout>>;

    /**
     * Creates an instance of NetHost.
     * This does not open the server for connections.
     * @param {NetHostConstructionOptions} options The options to construct the NetHost with
     * @memberof NetHost
     */
    constructor(options: NetHostConstructionOptions) {
        this._port = options.port;
        this._webSocketServer = null;
        this._nextID = 0;

        const a = Object.values(ClientEventType);

        this._validEvents = new Set(
            Object.values(ClientEventType).filter((val) => val !== ClientEventType.ConnectionInfo)
        );

        this._emitter = new EventEmitter();
        this._clients = new Map();
        this._timeoutMap = new Map();
    }

    /**
     * Set up a callback to perform when a network event occurs.
     * This is set up to act like an EventEmitter
     *
     * @param {(string | symbol)} event
     * @param {(...args: any[]) => void} callback
     * @memberof NetHost
     */
    public on(event: string | symbol, callback: (...args: any[]) => void) {
        this._emitter.on(event, callback);
    }

    /**
     * Opens the server to new connections.
     *
     * @memberof NetHost
     */
    public start() {
        this._webSocketServer = new WebSocket.Server({port: this._port});
        this._webSocketServer.on("connection", (socket: WebSocket, request: http.IncomingMessage) => {
            this._hookHandshakeCallback(socket, request);
            const packet = new ServerConnectionInfoRequestPacket();
            socket.send(new ServerNetEvent(ServerEventType.ConnectionInfoRequest, packet.serialize()).serialize());
            this._timeoutMap.set(socket, setTimeout(() => {
                console.log("Pre-client connection from " + socket.url + " timed out.");
                // The client did not reply quickly enough with connection info
                socket.close();
            }, CONNECTION_INFO_TIMEOUT));
        });
    }

    /**
     * Sends a net event to a client
     *
     * @param {number} client The client to send the net event to
     * @param {ServerNetEvent} event The net event to send
     * @memberof NetHost
     */
    public send(client: number, event: ServerNetEvent) {
        const netClient = this._clients.get(client);
        if (netClient !== undefined) {
            netClient.send(event);
        }
    }

    /**
     * Creates a callback associated with a socket for the sole purpose of completing a connection handshake.
     *
     * @private
     * @param {WebSocket} socket The socket to hook up the handshake callback for
     * @memberof NetHost
     */
    private _hookHandshakeCallback(socket: WebSocket, request: http.IncomingMessage) {
        const cb = (data: WebSocket.Data) => {
            try {
                const packetData = ClientNetEvent.deserialize(data);
                if (packetData !== undefined) {
                    if (packetData.type === ClientEventType.ConnectionInfo) {
                        clearTimeout(this._timeoutMap.get(socket)!);
                        this.validateToken(packetData.data.username, packetData.data.token)
                            .then((username) => {
                                console.log("Validated: " + username);
                                this._addClient(
                                    socket,
                                    request.connection.remoteAddress,
                                    request.connection.localAddress,
                                    username
                                );
                                socket.removeListener("message", cb);
                            })
                            .catch((err) => {
                                console.log(err);
                                socket.removeListener("message", cb);
                            });
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
        };
        socket.on("message", cb);
    }

    /**
     * Fully create a client after completing the connection handshake
     * This takes the socket and turns it into a proper NetClient
     *
     * @private
     * @param {WebSocket} socket The socket to turn into a NetClient
     * @param {ClientNetEvent} dataEvent the NetEvent containing client connection information
     * @memberof NetHost
     */
    private _addClient(socket: WebSocket, clientIP: string | undefined, serverIP: string, username: string) {
        const id = this._nextID;
        if (clientIP === undefined) {
            clientIP = "undefined";
        }
        const client = new NetClient({id, ip: clientIP, socket});
        this._nextID++;
        this._clients.set(id, client);

        client.on("event", async (event: ClientNetEvent) => {
            if (event.type === ClientEventType.DisconnectionRequest) {
                this._emitter.emit("disconnect", id, event);
                client.disconnect();
                this._clients.delete(id);
            }
            if (this._validEvents.has(event.type)) {
                this._emitter.emit("event", id, event);
            }
            else {
                let eventName: string = ClientEventType[event.type];
                if (eventName === undefined) {
                    eventName = "UNKNOWN_CLIENT_EVENT [" + event.type + "]";
                }
                console.error("Unexpected NetEvent from Client ", id, ": ", eventName, ". Ignoring event.");
            }
        });

        client.on("disconnect", (data) => {
            this._emitter.emit("disconnect", id, new ClientNetEvent(
                ClientEventType.Disconnect,
                new ClientDisconnectPacket(data.code))
            );
        });
        client.send(new ServerNetEvent(
            ServerEventType.ConnectionAcknowledgement,
            new ServerConnectionAcknowledgementPacket(this.resourceServerIPGetter(serverIP)))
        );
        this._emitter.emit("connection", id, new ClientNetEvent(
            ClientEventType.Connection,
            new ClientConnectionTokenPacket(id, clientIP, username))
        );
    }
}
