import {EventEmitter} from "events";
import * as http from "http";
import * as WebSocket from "ws";
import ClientNetEvent, { ClientEventType } from "./client-net-event";
import NetClient from "./net-client";
import ServerConnectionInfoRequestPacket from "./packets/server-connection-info-request-packet";
import ServerNetEvent, { ServerEventType } from "./server-net-event";

const CONNECTION_INFO_TIMEOUT = 10000; // milliseconds

/**
 * The constructor options for the NetHost
 *
 * @interface INetHostConstructionOptions
 */
interface INetHostConstructionOptions {
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
    private emitter: EventEmitter;
    private port: number;
    private webSocketServer: WebSocket.Server | null;
    private nextID: number;
    private clients: Map<number, NetClient>;
    private validEvents: Set<number>;
    private timeoutMap: Map<string, ReturnType<typeof setTimeout>>;

    /**
     * Creates an instance of NetHost.
     * This does not open the server for connections.
     * @param {INetHostConstructionOptions} options The options to construct the NetHost with
     * @memberof NetHost
     */
    constructor(options: INetHostConstructionOptions) {
        this.port = options.port;
        this.webSocketServer = null;
        this.nextID = 0;

        this.validEvents = new Set(
            Object.values(ClientEventType).filter((val) => val !== ClientEventType.ConnectionInfo)
        );

        this.emitter = new EventEmitter();
        this.clients = new Map();
        this.timeoutMap = new Map();
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
        this.emitter.on(event, callback);
    }

    /**
     * Opens the server to new connections.
     *
     * @memberof NetHost
     */
    public start() {
        this.webSocketServer = new WebSocket.Server({port: this.port});
        this.webSocketServer.on("connection", (socket: WebSocket, request: http.IncomingMessage) => {
            this.hookHandshakeCallback(socket, request);
            const packet = new ServerConnectionInfoRequestPacket();
            socket.send(new ServerNetEvent(ServerEventType.ConnectionInfoRequest, packet.serialize()).serialize());
            this.timeoutMap.set(socket.url, setTimeout(() => {
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
        const netClient = this.clients.get(client);
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
    private hookHandshakeCallback(socket: WebSocket, request: http.IncomingMessage) {
        const cb = (data: WebSocket.Data) => {
            try {
                const packetData = ClientNetEvent.deserialize(data);
                if (packetData !== undefined) {
                    if (packetData.type === ClientEventType.ConnectionInfo) {
                        clearTimeout(this.timeoutMap.get(socket.url)!);
                        this.addClient(socket, request.connection.remoteAddress, packetData);
                        socket.removeListener("message", cb);
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
    private addClient(socket: WebSocket, ip: string | undefined, dataEvent: ClientNetEvent) {
        const id = this.nextID;
        if (ip === undefined) {
            ip = "undefined";
        }
        const client = new NetClient({id, ip, socket});
        this.nextID++;
        this.clients.set(id, client);

        client.on("event", async (event: ClientNetEvent) => {
            if (event.type === ClientEventType.DisconnectionRequest) {
                this.emitter.emit("disconnect", id, event);
                client.disconnect();
                this.clients.delete(id);
            }
            if (this.validEvents.has(event.type)) {
                this.emitter.emit("event", id, event);
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
            this.emitter.emit("disconnect", id, new ClientNetEvent(ClientEventType.Disconnect, data));
        });
        // Necessary for now
        dataEvent.data.clientID = id;
        dataEvent.data.ip = ip;
        this.emitter.emit("connection", id, new ClientNetEvent(ClientEventType.Connection, dataEvent.data));
    }
}
