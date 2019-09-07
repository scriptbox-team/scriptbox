import Difference from "core/difference";
import IExports from "core/export-values";
import Player from "core/players/player";
import _ from "lodash";
import ServerDisplayPacket from "networking/packets/server-display-packet";
import ServerMessage from "networking/server-messages/server-message";
import { MessageRecipient, MessageRecipientType } from "networking/server-messages/server-message-recipient";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";
import RenderObject from "./render-object";

export default class DisplaySystem {
    private _objectDisplayCallback?: (message: ServerMessage) => void;
    public sendFullDisplayToPlayer(exportList: IExports, player: Player) {
        const diff = new Difference<{x: number, y: number}>();
        diff.added = _.transform(exportList.entities, (acc, entity, key) => {
            acc[key] = entity.position;
        }, {} as any as {[id: string]: {x: number, y: number}});
        const updatesToSend = this.dataToDisplayObjects(diff);
        this.sendObjectDisplaysToPlayer(updatesToSend, player);
    }

    public broadcastDisplayChanges(lastExportValues: IExports, exportValues: IExports) {
        const changes = this.getDisplayDifferences(lastExportValues, exportValues);
        const updatesToSend = this.dataToDisplayObjects(changes);
        this.broadcastObjectDisplays(updatesToSend);
    }
    public onObjectDisplay(callback: (message: ServerMessage) => void) {
        this._objectDisplayCallback = callback;
    }
    private dataToDisplayObjects(data: Difference<{x: number, y: number}>) {
        let arr: RenderObject[] = [];
        for (const datum of [data.added, data.updated, data.removed]) {
            arr = _.transform(datum, (acc, position, id) => {
                const idNum = Number.parseInt(id, 10);
                acc.push(new RenderObject(
                    idNum, // For now these will be the same
                    idNum,
                    "testCombined.png",
                    {x: 0, y: 0, width: 32, height: 32},
                    position,
                    0,
                    datum === data.removed));
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

    private getDisplayDifferences(lastExportValues: IExports, exportValues: IExports) {
        // Lodash type annotations are really restrictive
        // So please ignore the following casting shenanigans
        const diffs = _.transform(exportValues.entities, (acc, entity, key) => {
            const currentPosition = entity.position;
            const result = acc as any;
            const prevState = lastExportValues.entities[key];
            if (prevState === undefined || prevState.position === undefined) {
                result.added[key] = currentPosition;
            }
            else if (prevState.position.x !== currentPosition.x || prevState.position.y !== currentPosition.y) {
                result.updated[key] = currentPosition;
            }
        }, {added: {}, updated: {}, removed: {}}) as any as Difference<{x: number, y: number}>;
        _.each(lastExportValues.entities, (value, key) => {
            if (exportValues.entities[key] === undefined) {
                diffs.removed[key] = value.position;
            }
        });
        return diffs;
    }
}
