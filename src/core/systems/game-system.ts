import Player from "core/player";
import PlayerGroup, { PlayerGroupType } from "core/player-group";
import fs from "fs-extra";
import IVM from "isolated-vm";
import _ from "lodash";
import path from "path";
import ScriptCollection from "scripting/script-collection";

import System from "./system";

export default class GameSystem extends System {
    public loadScriptResource?: (resourceID: string) => Promise<string>;
    private _messageQueue: Array<{recipient: PlayerGroup, message: string}>;
    private _scriptCollection: ScriptCollection;
    constructor() {
        super();
        this._messageQueue = [];
        const fileDirs = [
            "./aspect.ts",
            "./manager.ts",
            "./entity.ts",
            "./component.ts",
            "./position.ts",
            "./scripted-server-subsystem.ts",
            "./aspect.ts",
            "./control.ts",
            "./default-control.ts",
            "./aspect-array.ts",
            "./velocity.ts",
            "./collision-box.ts",
            "./meta-info.ts",
            "./manager.ts",
             "./id-generator.ts"
        ];
        const baseScriptDir = path.join(__dirname, "../../__scripted__/");

        const scripts: any = _.transform(fileDirs, (result, value) => {
            result[value.substr(0, value.length - 3)] = fs.readFileSync(
                path.join(baseScriptDir, value),
                {encoding: "utf8"});
        }, {} as {[s: string]: string});

        this._scriptCollection = new ScriptCollection(scripts);
    }
    public update() {
        this._scriptCollection.execute("./scripted-server-subsystem", "update");
        const result = this._scriptCollection.runIVMScript("./scripted-server-subsystem",
        `
            new IVM.ExternalCopy(global.exportValues).copyInto();
        `).result;

        if (result.messages === undefined) {
            result.messages = [];
        }
        result.messages = result.messages.concat(this._messageQueue);
        this._messageQueue = [];

        return result;
    }
    public createPlayer(player: Player) {
        const entID = this._scriptCollection.execute("./scripted-server-subsystem", "createEntity");
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createComponent",
            entID,
            "position",
            "position",
            Math.random() * 150,
            Math.random() * 150
        );
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createComponent",
            entID,
            "velocity",
            "velocity",
            0,
            0
        );
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createComponent",
            entID,
            "default-control",
            "control"
        );
        player!.controllingEntity = entID;
    }
    public handleKeyInput(key: number, state: number, player: Player) {
        const input = player!.convertInput(key);
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "handleInput",
            player!.controllingEntity,
            input,
            state
        );
    }
    public createEntityAt(prefabID: string, x: number, y: number, player: Player) {
        const entID = this._scriptCollection.execute("./scripted-server-subsystem", "createEntity");
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createComponent",
            entID,
            "position",
            "position",
            x,
            y
        );
    }
    public deleteEntity(id: string) {
        this._scriptCollection.execute("./scripted-server-subsystem", "deleteEntity", id);
    }
    public setPlayerEntityInspection(player: Player, entityID?: string) {
        this._scriptCollection.execute("./scripted-server-subsystem", "inspectEntity", player.id, entityID);
    }
    public removeComponent(componentID: string) {
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "deleteComponent",
            componentID
        );
    }
    public async runResourcePlayerScript(resourceID: string, args: string, player: Player, entityID?: string) {
        try {
            if (this.loadScriptResource !== undefined) {
                const script = await this.loadScriptResource(resourceID);
                const result = await this.runPlayerScript(script, args, player, entityID, resourceID);
                if (result !== undefined) {
                    this.addMessageToQueue(new PlayerGroup(PlayerGroupType.Only, [player]), `Script result: ${result}`);
                }
            }
        }
        catch (err) {
            this.addMessageToQueue(new PlayerGroup(PlayerGroupType.Only, [player]),
                `<${err.stack}>`
            );
        }
    }
    public async runGenericPlayerScript(script: string, player: Player) {
        try {
            const result = await this.runPlayerScript(script, "", player);
            if (result !== undefined) {
                this.addMessageToQueue(
                    new PlayerGroup(PlayerGroupType.Only, [player]),
                    `${script} Result: ${result}`
                );
            }
        }
        catch (err) {
            this.addMessageToQueue(new PlayerGroup(PlayerGroupType.Only, [player]),
                `<${err.stack}>`
            );
            console.log(err);
        }
    }
    public async runPlayerScript(code: string, args: string, player: Player, entityID?: string, className?: string) {
        let thisValue: IVM.Reference<any> | undefined;
        if (entityID !== undefined) {
            thisValue = this._scriptCollection.executeReturnRef(
                "./scripted-server-subsystem",
                "getEntity",
                entityID
            );
        }
        const script = await this._scriptCollection.runScript(code, args, thisValue);
        const defaultExport = script.getReference("default");
        if (defaultExport.typeof !== "undefined" && className !== undefined) {
            this._scriptCollection.execute(
                "./scripted-server-subsystem",
                "setComponentClass",
                defaultExport.derefInto(),
                className
            );
            if (entityID !== undefined) {
                this._scriptCollection.execute(
                    "./scripted-server-subsystem",
                    "createComponent",
                    entityID,
                    className,
                    className
                );
            }
        }
        if (script.result !== undefined) {
            return script.result;
        }
        return undefined;
    }

    public addMessageToQueue(playerGroup: PlayerGroup, message: string) {
        this._messageQueue.push({recipient: playerGroup, message});
    }
}
