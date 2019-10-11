import NetEventHandler from "networking/net-event-handler";
import ServerMessage from "./server-messages/server-message";

export default abstract class Networker {
    public onServerMessageSend?: (message: ServerMessage) => void;
    public send(message: ServerMessage) {
        if (this.onServerMessageSend !== undefined) {
            this.onServerMessageSend(message);
        }
    }
    public abstract hookupInput(netEventHandler: NetEventHandler): void;
}
