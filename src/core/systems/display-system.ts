import Client from "core/client";
import Difference from "core/difference";
import Exports from "core/export-values";
import Group, { GroupType } from "core/group";
import _ from "lodash";
import AudioObject from "resource-management/audio-object";
import ComponentInfo from "resource-management/component-info";
import ComponentOption, { ComponentOptionType } from "resource-management/component-option";
import RenderObject from "resource-management/render-object";

import System from "./system";

interface Sprite {
    ownerID: string | undefined;
    texture: string;
    textureSubregion: {x: number, y: number, width: number, height: number};
    position: {x: number, y: number};
    scale: {x: number, y: number};
    depth: number;
}

/**
 * A system of the server which handles transforming information returned from the update loop into data which can
 * be sent to the clients. This includes objects to render, sounds to play, camera position, and entity
 * inspection information.
 *
 * @export
 * @class DisplaySystem
 * @module core
 * @extends {System}
 */
export default class DisplaySystem extends System {
    private _lastExportValues: Exports;
    private _renderDisplayObjectCallback?: (renderObjects: RenderObject[], clientGroup: Group<Client>) => void;
    private _cameraDataCallback?: (player: Client, cameraData: {x: number, y: number, scale: number}) => void;
    private _soundDataCallback?: (audioObjects: AudioObject[], playerGroup: Group<Client>) => void;
    private _entityInspectionCallback?: (
        entityID: string,
        components: ComponentInfo[],
        controlledByInspector: boolean,
        playerGroup: Group<Client>) => void;
    /**
     * Creates an instance of DisplaySystem.
     * @memberof DisplaySystem
     */
    constructor() {
        super();
        this._lastExportValues = {
            entities: {},
            sprites: {},
            inspectedEntityInfo: {},
            messages: [],
            sounds: {},
            players: {}
        };
    }
    /**
     * Sends the entire stored display data to a specific client.
     * This is useful for catching up a player with the current game state when they connect.
     * @param {Client} player The player to send the display data too.
     * @memberof DisplaySystem
     */
    public sendFullDisplayToPlayer(player: Client) {
        const diff = new Difference<RenderObject>();
        diff.added = _.transform(this._lastExportValues.sprites, (acc, sprite, key) => {
            acc[key] = this._convertToRenderObject(
                key,
                sprite
            );
        }, {} as any as {[id: string]: RenderObject});
        const updatesToSend = this._dataToDisplayObjects(diff);
        this._sendDisplayObjectsToPlayer(updatesToSend, player);
    }

    /**
     * Broadcast display differences to all players based on a GameSystem export.
     * @param {Exports} exportValues The GameSystem export to broadcast display differences from
     * @memberof DisplaySystem
     */
    public broadcastDisplay(exportValues: Exports) {
        const time = Date.now();
        const changes = this._getDisplayDifferences(this._lastExportValues, exportValues);
        const updatesToSend = this._dataToDisplayObjects(changes);
        this._broadcastDisplayObjects(updatesToSend);
        this._lastExportValues = exportValues;
    }

    /**
     * Send camera data to each player based on a GameSystem export.
     *
     * @param {Exports} exportValues The GameSystem export to get camera data from.
     * @memberof DisplaySystem
     */
    public sendCameraData(exportValues: Exports) {
        _.each(exportValues.players, (playerData, id) => {
            if (this._cameraDataCallback !== undefined) {
                if (playerData.client !== undefined) {
                    this._cameraDataCallback(playerData.client, playerData.camera);
                }
            }
        });
    }
    /**
     * Send sound data to each player based on a GameSystem export.
     * This will also reduce the volume of far away sounds.
     *
     * @param {Exports} exportValues The GameSystem export to get sound data from.
     * @memberof DisplaySystem
     */
    public sendSoundData(exportValues: Exports) {
        _.each(exportValues.players, (playerData, id) => {
            const playerCamera = playerData.camera;
            const sounds: AudioObject[] = [];
            _.each(exportValues.sounds, (soundData, soundID) => {
                const vec = {
                    x: soundData.position.x - playerCamera.x,
                    y: soundData.position.y - playerCamera.y
                };
                const dist = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
                const vol = soundData.volume * (1 - dist / 320);
                if (vol > 0) {
                    sounds.push(new AudioObject(soundID, soundData.resource, vol, false));
                }
            });
            if (sounds.length > 0 && this._soundDataCallback !== undefined) {
                if (playerData.client !== undefined) {
                    this._soundDataCallback(sounds, new Group<Client>(GroupType.Only, [playerData.client]));
                }
            }
        });
    }
    /**
     * Set the callback to be called when render objects are broadcasted by the DisplaySystem.
     *
     * @param {(renderObjects: RenderObject[], playerGroup: Group<Client>) => void} callback The callback to use.
     * @memberof DisplaySystem
     */
    public onRenderObjectDisplay(callback: (renderObjects: RenderObject[], playerGroup: Group<Client>) => void) {
        this._renderDisplayObjectCallback = callback;
    }
    /**
     * Set the callback to be called when camera data is sent by the DisplaySystem
     *
     * @param {(
     *      player: Client,
     *      cameraData: {x: number, y: number, scale: number}) => void} callback The callback to use.
     * @memberof DisplaySystem
     */
    public onCameraData(callback: (player: Client, cameraData: {x: number, y: number, scale: number}) => void) {
        this._cameraDataCallback = callback;
    }
    /**
     * Set the callback to be called when sound data is sent by the DisplaySystem
     *
     * @param {(audioObjects: AudioObject[], playerGroup: Group<Client>) => void} callback The callback to use.
     * @memberof DisplaySystem
     */
    public onSoundData(callback: (audioObjects: AudioObject[], playerGroup: Group<Client>) => void) {
        this._soundDataCallback = callback;
    }
    /**
     * Set the callback to be called when entity inspection data is sent by the DisplaySystem
     * @param {(
     *      entityID: string,
     *      components: ComponentInfo[],
     *      controlledByInspector: boolean,
     *      playerGroup: Group<Client>) => void} callback The callback to use.
     * @memberof DisplaySystem
     */
    public onEntityInspection(callback: (
            entityID: string,
            components: ComponentInfo[],
            controlledByInspector: boolean,
            playerGroup: Group<Client>) => void) {
        this._entityInspectionCallback = callback;
    }
    /**
     * Send the entity inspection data to each player based on a GameSystem export.
     * @param {Exports} exportValues The GameSystem export to get entity inspection data from.
     * @memberof DisplaySystem
     */
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
                    "", 0, "", component.enabled, attributes);
            });
            const player = exportValues.players![playerID];
            if (player !== undefined && player.client !== undefined) {
                this._entityInspectionCallback!(
                    entityInfo.id,
                    components,
                    entityInfo.controlledBy === playerID,
                    new Group(GroupType.Only, [player.client])
                );
            }
        }
    }
    /**
     * Convert a RenderObject difference list to a list of RenderObjects to send to a client.
     *
     * @private
     * @param {Difference<RenderObject>} data The RenderObject difference list to convert.
     * @returns An array of RenderObjects to send.
     * @memberof DisplaySystem
     */
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
    /**
     * Send a RenderObject array to all players.
     * This uses the render object display callback.
     *
     * @private
     * @param {RenderObject[]} pack The RenderObject array to send.
     * @memberof DisplaySystem
     */
    private _broadcastDisplayObjects(pack: RenderObject[]) {
        this._renderDisplayObjectCallback!(
            pack,
            new Group(GroupType.All, [])
        );
    }
    /**
     * Send a RenderObject array to a single player.
     * This uses the render object display callback.
     *
     * @private
     * @param {RenderObject[]} pack The RenderObject array to send.
     * @param {Client} player The player to send the display to.
     * @memberof DisplaySystem
     */
    private _sendDisplayObjectsToPlayer(pack: RenderObject[], player: Client) {
        this._renderDisplayObjectCallback!(
            pack,
            new Group(GroupType.Only, [player])
        );
    }

    /**
     * Get the display differences between two GameSystem exports.
     *
     * @private
     * @param {Exports} lastExportValues The GameSystem export representing the previous state.
     * @param {Exports} exportValues The GameSystem export representing the current state.
     * @returns A list of differences between the object displays of the GameSystem exports.
     * @memberof DisplaySystem
     */
    private _getDisplayDifferences(lastExportValues: Exports, exportValues: Exports) {
        const diffs = _.transform(exportValues.sprites, (acc, sprite, key) => {
            const result = acc;
            const prevSprite = lastExportValues.sprites[key];
            if (prevSprite === undefined) {
                result.added[key] = this._convertToRenderObject(
                    key,
                    sprite
                );
            }
            else if (!this._same(sprite, prevSprite)) {
                result.updated[key] = this._convertToRenderObject(
                    key,
                    sprite
                );
            }
        }, {
            added: {} as {[id: string]: RenderObject},
            updated: {} as {[id: string]: RenderObject},
            removed: {} as {[id: string]: RenderObject}}) as Difference<RenderObject>;
        _.each(lastExportValues.sprites, (sprite, key) => {
            if (exportValues.sprites[key] === undefined) {
                diffs.removed[key] = this._convertToRenderObject(key, sprite);
            }
        });
        return diffs;
    }

    /**
     * Convert exported sprite data to a RenderObject
     *
     * @private
     * @param {string} key The ID of the RenderObject
     * @param {Sprite} sprite The sprite to convert to a RenderObject
     * @returns The RenderObject created from the sprite information.
     * @memberof DisplaySystem
     */
    private _convertToRenderObject(key: string, sprite: Sprite) {
        return new RenderObject(
            sprite.ownerID,
            key,
            sprite.texture,
            sprite.textureSubregion,
            sprite.position,
            sprite.scale,
            sprite.depth,
            false
        );
    }

    /**
     * Check whether two sprites are the same
     *
     * @private
     * @param {Sprite} currSprite The first sprite to compare
     * @param {Sprite} prevSprite The second sprite to compare
     * @returns True if the sprites are the same, false if they aren't
     * @memberof DisplaySystem
     */
    private _same(
            currSprite: Sprite,
            prevSprite: Sprite) {
        return currSprite.position.x === prevSprite.position.x
            && currSprite.position.y === prevSprite.position.y
            && currSprite.scale.x === prevSprite.scale.x
            && currSprite.scale.y === prevSprite.scale.y
            && currSprite.depth === prevSprite.depth
            && currSprite.ownerID === prevSprite.ownerID
            && currSprite.texture === prevSprite.texture
            && currSprite.textureSubregion.x === prevSprite.textureSubregion.x
            && currSprite.textureSubregion.y === prevSprite.textureSubregion.y
            && currSprite.textureSubregion.width === prevSprite.textureSubregion.width
            && currSprite.textureSubregion.height === prevSprite.textureSubregion.height;
    }
}
