import NetEventHandler from "networking/net-event-handler";
import ServerMessage from "./server-messages/server-message";

/**
 * An interface for a system for interacting with the networking functionality.
 * The exact callbacks and delegates are defined in the subclasses.
 * @module networking
 */
export default abstract class Networker {
    public onServerMessageSend?: (message: ServerMessage) => void;
    public send(message: ServerMessage) {
        if (this.onServerMessageSend !== undefined) {
            this.onServerMessageSend(message);
        }
    }
    public abstract hookupInput(netEventHandler: NetEventHandler): void;
}
