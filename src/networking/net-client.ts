import {EventEmitter} from "events";
import {ClientRequest} from "http";
import * as WebSocket from "ws";
import ClientNetEvent from "./client-net-event";
import ServerNetEvent from "./server-net-event";

/**
 * The constructor options for the Net Client
 *
 * @interface INetClientConstructorOptions
 */
interface INetClientConstructorOptions {
    /**
     * The ID to assign to the client
     *
     * @type {number}
     * @memberof INetClientConstructorOptions
     */
    id: number;
    /**
     * The socket associated with the client ID
     *
     * @type {WebSocket}
     * @memberof INetClientConstructorOptions
     */
    socket: WebSocket;
    ip: string;
}

/**
 * A class representing a single client connected to the server.
 * This is used by the NetHost to represent the different clients connected to the server.
 * This acts as a wrapper around the socket and its callbacks related to network events.
 *
 * @export
 * @class NetClient
 */
export default class NetClient {
    private emitter: EventEmitter;
    private id: number;
    private ip: string;
    private socket: WebSocket;
    /**
     * Creates an instance of NetClient.
     * @param {INetClientConstructorOptions} options The options to initialize the client with.
     * @memberof NetClient
     */
    constructor(options: INetClientConstructorOptions) {
        this.emitter = new EventEmitter();
        this.id = options.id;
        this.socket = options.socket;
        this.ip = options.ip;
        this.socket.on("message", (event: WebSocket.Data) => {
            try {
                const packetData = ClientNetEvent.deserialize(event);
                if (packetData !== undefined) {
                    this.receive(packetData);
                }
            }
            catch (e) {
                console.error(e);
            }
        });
        this.socket.on("close", (code: number, reason: string) => {
            this.emitter.emit("disconnect", {code});
        });
        this.socket.on("unexpected-response", (request: ClientRequest) => {
            console.error("Received unexpected response from Client " + this.id);
        });
        this.socket.on("error", (err) => {
            console.error("Error from client " + this.id + ": " + err.message);
        });
    }

    /**
     * Set up a callback to perform on reaction to an event from the client.
     * Set up to act like the EventEmitter
     *
     * @param {(string | symbol)} event The event to set up the callback for
     * @param {(...args: any[]) => void} callback The callback to perform on the event
     * @memberof NetClient
     */
    public on(event: string | symbol, callback: (...args: any[]) => void) {
        this.emitter.on(event, callback);
    }

    /**
     * Send a server net event to this client.
     * This serializes the net event automatically.
     *
     * @param {ServerNetEvent} e The event to send
     * @memberof NetClient
     */
    public send(e: ServerNetEvent) {
        try {
            this.socket.send(e.serialize());
        }
        catch (e) {
            throw e;
        }
    }

    /**
     * Disconnect this client from the server with code 1000
     *
     * @memberof NetClient
     */
    public async disconnect() {
        this.emitter.emit("disconnect", {code: 1000});
        this.socket.close();
    }

    /**
     * Perform actions when receiving a packet.
     * This emits the necessary event with the packet information.
     *
     * @param {ClientNetEvent} e
     * @memberof NetClient
     */
    private receive(e: ClientNetEvent) {
        this.emitter.emit("event", e);
    }
}
