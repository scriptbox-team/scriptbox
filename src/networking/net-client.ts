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
    private _emitter: EventEmitter;
    private _id: number;
    private _ip: string;
    private _socket: WebSocket;
    /**
     * Creates an instance of NetClient.
     * @param {INetClientConstructorOptions} options The options to initialize the client with.
     * @memberof NetClient
     */
    constructor(options: INetClientConstructorOptions) {
        this._emitter = new EventEmitter();
        this._id = options.id;
        this._socket = options.socket;
        this._ip = options.ip;
        this._socket.on("message", (event: WebSocket.Data) => {
            try {
                const packetData = ClientNetEvent.deserialize(event);
                if (packetData !== undefined) {
                    this._receive(packetData);
                }
            }
            catch (e) {
                console.error(e);
            }
        });
        this._socket.on("close", (code: number, reason: string) => {
            this._emitter.emit("disconnect", {code});
        });
        this._socket.on("unexpected-response", (request: ClientRequest) => {
            console.error("Received unexpected response from Client " + this._id);
        });
        this._socket.on("error", (err) => {
            console.error("Error from client " + this._id + ": " + err.message);
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
        this._emitter.on(event, callback);
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
            if (this._socket.readyState === 1) {
                this._socket.send(e.serialize());
            }
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
        this._emitter.emit("disconnect", {code: 1000});
        this._socket.close();
    }

    /**
     * Perform actions when receiving a packet.
     * This emits the necessary event with the packet information.
     *
     * @param {ClientNetEvent} e
     * @memberof NetClient
     */
    private _receive(e: ClientNetEvent) {
        this._emitter.emit("event", e);
    }
}
