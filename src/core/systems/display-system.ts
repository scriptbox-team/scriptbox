import Difference from "core/difference";
import IExports from "core/export-values";
import Player from "core/player";
import PlayerGroup, { PlayerGroupType } from "core/player-group";
import _ from "lodash";
import ComponentInfo from "resource-management/component-info";
import ComponentOption, { ComponentOptionType } from "resource-management/component-option";
import RenderObject from "resource-management/render-object";
import System from "./system";

export default class DisplaySystem extends System {
    private _lastExportValues: IExports;
    private _objectDisplayCallback?: (renderObjects: RenderObject[], playerGroup: PlayerGroup) => void;
    private _entityInspectionCallback?: (
        entityID: string,
        components: ComponentInfo[],
        playerGroup: PlayerGroup) => void;
    constructor() {
        super();
        this._lastExportValues = {
            entities: {},
            watchedEntityInfo: {}
        };
    }
    public sendFullDisplayToPlayer(player: Player) {
        const diff = new Difference<{x: number, y: number}>();
        diff.added = _.transform(this._lastExportValues.entities, (acc, entity, key) => {
            acc[key] = entity.position;
        }, {} as any as {[id: string]: {x: number, y: number}});
        const updatesToSend = this._dataToDisplayObjects(diff);
        this._sendObjectDisplaysToPlayer(updatesToSend, player);
    }

    public broadcastDisplay(exportValues: IExports) {
        const changes = this._getDisplayDifferences(this._lastExportValues, exportValues);
        const updatesToSend = this._dataToDisplayObjects(changes);
        this._broadcastObjectDisplays(updatesToSend);
        this._lastExportValues = exportValues;
    }
    public onObjectDisplay(callback: (renderObjects: RenderObject[], playerGroup: PlayerGroup) => void) {
        this._objectDisplayCallback = callback;
    }
    public onEntityInspection(callback: (
            entityID: string,
            components: ComponentInfo[],
            playerGroup: PlayerGroup) => void) {
        this._entityInspectionCallback = callback;
    }
    public sendWatchedObjects(exportValues: IExports) {
        const players = Object.keys(exportValues.watchedEntityInfo);
        for (const playerID of players) {
            const entityInfo = exportValues.watchedEntityInfo[playerID];
            const components = Object.values(entityInfo.componentInfo).map((component) => {
                const attributes = component.attributes.map((attribute) => {
                    let optionType = ComponentOptionType.Object;
                    switch (attribute.kind) {
                        case "number": {
                            optionType = ComponentOptionType.Number;
                            break;
                        }
                        case "string": {
                            optionType = ComponentOptionType.String;
                            break;
                        }
                        case "boolean": {
                            optionType = ComponentOptionType.Boolean;
                            break;
                        }
                    }
                    return new ComponentOption(attribute.name, attribute.name, optionType, attribute.value, true);
                });
                return new ComponentInfo(component.id, component.name,
                    "n/a", "blah blah", 0, "", attributes);
            });
            const player = exportValues.players![playerID];
            if (player !== undefined) {
                this._entityInspectionCallback!(
                    entityInfo.id,
                    components,
                    new PlayerGroup(PlayerGroupType.Only, [player])
                );
            }
        }
    }
    private _dataToDisplayObjects(data: Difference<{x: number, y: number}>) {
        let arr: RenderObject[] = [];
        for (const datum of [data.added, data.updated, data.removed]) {
            arr = _.transform(datum, (acc, position, id) => {
                acc.push(new RenderObject(
                    id, // For now these will be the same
                    id,
                    "testCombined.png",
                    {x: 0, y: 0, width: 32, height: 32},
                    position,
                    0,
                    datum === data.removed));
            }, arr);
        }
        return arr;
    }
    private _broadcastObjectDisplays(pack: RenderObject[]) {
        this._objectDisplayCallback!(
            pack,
            new PlayerGroup(PlayerGroupType.All, [])
        );
    }
    private _sendObjectDisplaysToPlayer(pack: RenderObject[], player: Player) {
        this._objectDisplayCallback!(
            pack,
            new PlayerGroup(PlayerGroupType.Only, [player])
        );
    }

    private _getDisplayDifferences(lastExportValues: IExports, exportValues: IExports) {
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
