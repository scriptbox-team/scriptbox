import Difference from "core/difference";
import Player from "core/players/player";
import _ from "lodash";
import ServerDisplayPacket from "networking/packets/server-display-packet";
import ServerMessage from "networking/server-messages/server-message";
import { MessageRecipient, MessageRecipientType } from "networking/server-messages/server-message-recipient";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";
import RenderObject from "./render-object";

export default class DisplaySystem {
    private _objectDisplayCallback?: (message: ServerMessage) => void;

    // Since this is a thing I keep doing I'll go ahead and remind myself here
    // TODO: Rename all functions that are "onXXXXXXXX" that aren't for registering a callback
    public sendFullDisplayToPlayer(fullObjectList: {[id: string]: {x: number, y: number}}, player: Player) {
        const updatesToSend = this.dataToDisplayObjects(fullObjectList);
        this.sendObjectDisplaysToPlayer(updatesToSend, player);
    }

    public broadcastDisplayChanges(changes: Difference<{x: number, y: number}>) {
        const updatesToSend = this.dataToDisplayObjects(changes.added, changes.updated);
        this.broadcastObjectDisplays(updatesToSend);
    }
    public onObjectDisplay(callback: (message: ServerMessage) => void) {
        this._objectDisplayCallback = callback;
    }
    private dataToDisplayObjects(...data: Array<{[id: string]: {x: number, y: number}}>) {
        let arr: RenderObject[] = [];
        for (const datum of data) {
            arr = _.transform(datum, (acc, position, id) => {
                acc.push(new RenderObject(
                    Number.parseInt(id, 10),
                    "testCombined.png",
                    {x: 0, y: 0, width: 32, height: 32},
                    position,
                    0));
            }, arr);
        }
        return arr;
    }
    private broadcastObjectDisplays(pack: RenderObject[]) {
        this._objectDisplayCallback!(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.DisplayPackage, new ServerDisplayPacket(pack)),
                new MessageRecipient(MessageRecipientType.All, [])
            )
        );
    }
    private sendObjectDisplaysToPlayer(pack: RenderObject[], player: Player) {
        this._objectDisplayCallback!(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.DisplayPackage, new ServerDisplayPacket(pack)),
                new MessageRecipient(MessageRecipientType.Only, [player])
            )
        );
    }
}
