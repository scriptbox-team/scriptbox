import Client from "core/client";
import Difference from "core/difference";
import Exports from "core/export-values";
import Group, { GroupType } from "core/group";
import _ from "lodash";
import ComponentInfo from "resource-management/component-info";
import ComponentOption, { ComponentOptionType } from "resource-management/component-option";
import RenderObject from "resource-management/render-object";

import System from "./system";

interface Sprite {
    ownerID: string;
    texture: string;
    textureSubregion: {x: number, y: number, width: number, height: number};
    offset: {x: number, y: number};
    depth: number;
}

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
            sprites: {},
            inspectedEntityInfo: {},
            messages: [],
            players: {}
        };
    }
    public sendFullDisplayToPlayer(player: Client) {
        const diff = new Difference<RenderObject>();
        diff.added = _.transform(this._lastExportValues.sprites, (acc, sprite, key) => {
            acc[key] = this._convertToRenderObject(
                key,
                this._lastExportValues.entities[sprite.ownerID].position,
                sprite
            );
        }, {} as any as {[id: string]: RenderObject});
        const updatesToSend = this._dataToDisplayObjects(diff);
        this._sendDisplayObjectsToPlayer(updatesToSend, player);
    }

    public broadcastDisplay(exportValues: Exports) {
        const changes = this._getDisplayDifferences(this._lastExportValues, exportValues);
        const updatesToSend = this._dataToDisplayObjects(changes);
        console.log(updatesToSend);
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
    private _dataToDisplayObjects(data: Difference<RenderObject>) {
        let arr: RenderObject[] = [];
        for (const datum of [data.added, data.updated, data.removed]) {
            arr = arr.concat(_.transform(datum, (acc, obj, id) => {
                obj.deleted = (datum === data.removed);
                acc.push(obj);
            }, [] as RenderObject[]));
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
        const diffs = _.transform(exportValues.sprites, (acc, sprite, key) => {
            const entity = exportValues.entities[sprite.ownerID];
            const result = acc;
            const prevEntity = lastExportValues.entities[sprite.ownerID];
            const prevSprite = lastExportValues.sprites[key];
            if (prevEntity === undefined || prevSprite === undefined) {
                result.added[key] = this._convertToRenderObject(
                    key,
                    exportValues.entities[sprite.ownerID].position,
                    sprite
                );
            }
            else if (!this._same(entity.position, sprite, prevEntity.position, prevSprite)) {
                result.updated[key] = this._convertToRenderObject(
                    key,
                    exportValues.entities[sprite.ownerID].position,
                    sprite
                );
            }
        }, {
            added: {} as {[id: string]: RenderObject},
            updated: {} as {[id: string]: RenderObject},
            removed: {} as {[id: string]: RenderObject}}) as Difference<RenderObject>;
        _.each(lastExportValues.sprites, (sprite, key) => {
            if (exportValues.sprites[key] === undefined) {
                const position = lastExportValues.entities[key].position;
                diffs.removed[key] = this._convertToRenderObject(key, position, sprite);
            }
        });
        return diffs;
    }

    private _convertToRenderObject(key: string, position: {x: number, y: number}, sprite: Sprite) {
        return new RenderObject(
            sprite.ownerID,
            key,
            sprite.texture,
            sprite.textureSubregion,
            {
                x: position.x + sprite.offset.x,
                y: position.y + sprite.offset.y
            },
            sprite.depth,
            false
        );
    }

    private _same(
            currPosition: {x: number, y: number},
            currSprite: Sprite,
            prevPosition: {x: number, y: number},
            prevSprite: Sprite) {
        return currPosition.x + currSprite.offset.x === prevPosition.x + prevSprite.offset.x
            && currPosition.y + currSprite.offset.y === prevPosition.y + prevSprite.offset.y
            && currSprite.depth === prevSprite.depth
            && currSprite.ownerID === prevSprite.ownerID
            && currSprite.texture === prevSprite.texture
            && currSprite.textureSubregion.x === prevSprite.textureSubregion.x
            && currSprite.textureSubregion.y === prevSprite.textureSubregion.y
            && currSprite.textureSubregion.width === prevSprite.textureSubregion.width
            && currSprite.textureSubregion.height === prevSprite.textureSubregion.height;
    }
}
