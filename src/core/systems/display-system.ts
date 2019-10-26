import Client from "core/client";
import Difference from "core/difference";
import Exports from "core/export-values";
import Group, { GroupType } from "core/group";
import _ from "lodash";
import ComponentInfo from "resource-management/component-info";
import ComponentOption, { ComponentOptionType } from "resource-management/component-option";
import RenderObject from "resource-management/render-object";

import System from "./system";

export default class DisplaySystem extends System {
    private _lastExportValues: Exports;
    private _renderDisplayObjectCallback?: (renderObjects: RenderObject[], clientGroup: Group<Client>) => void;
    private _entityInspectionCallback?: (
        entityID: string,
        components: ComponentInfo[],
        controlledByInspector: boolean,
        playerGroup: Group<Client>) => void;
    constructor() {
        super();
        this._lastExportValues = {
            entities: {},
            inspectedEntityInfo: {},
            messages: []
        };
    }
    public sendFullDisplayToPlayer(player: Client) {
        const diff = new Difference<{x: number, y: number}>();
        diff.added = _.transform(this._lastExportValues.entities, (acc, entity, key) => {
            acc[key] = entity.position;
        }, {} as any as {[id: string]: {x: number, y: number}});
        const updatesToSend = this._dataToDisplayObjects(diff);
        this._sendDisplayObjectsToPlayer(updatesToSend, player);
    }

    public broadcastDisplay(exportValues: Exports) {
        const changes = this._getDisplayDifferences(this._lastExportValues, exportValues);
        const updatesToSend = this._dataToDisplayObjects(changes);
        this._broadcastDisplayObjects(updatesToSend);
        this._lastExportValues = exportValues;
    }
    public onRenderObjectDisplay(callback: (renderObjects: RenderObject[], playerGroup: Group<Client>) => void) {
        this._renderDisplayObjectCallback = callback;
    }
    public onEntityInspection(callback: (
            entityID: string,
            components: ComponentInfo[],
            controlledByInspector: boolean,
            playerGroup: Group<Client>) => void) {
        this._entityInspectionCallback = callback;
    }
    public sendInspectedEntities(exportValues: Exports) {
        const players = Object.keys(exportValues.inspectedEntityInfo);
        for (const playerID of players) {
            const entityInfo = exportValues.inspectedEntityInfo[playerID];
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
                    "n/a", "blah blah", 0, "", component.enabled, attributes);
            });
            const player = exportValues.players![playerID];
            if (player !== undefined) {
                this._entityInspectionCallback!(
                    entityInfo.id,
                    components,
                    entityInfo.controlledBy === playerID,
                    new Group(GroupType.Only, [player])
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
    private _broadcastDisplayObjects(pack: RenderObject[]) {
        this._renderDisplayObjectCallback!(
            pack,
            new Group(GroupType.All, [])
        );
    }
    private _sendDisplayObjectsToPlayer(pack: RenderObject[], player: Client) {
        this._renderDisplayObjectCallback!(
            pack,
            new Group(GroupType.Only, [player])
        );
    }

    private _getDisplayDifferences(lastExportValues: Exports, exportValues: Exports) {
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
