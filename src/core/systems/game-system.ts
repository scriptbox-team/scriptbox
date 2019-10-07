import Player from "core/player";
import PlayerGroup, { PlayerGroupType } from "core/player-group";
import ScriptwiseSystem from "core/scriptwise-system";
import IVM from "isolated-vm";
import path from "path";

import System from "./system";

export default class GameSystem extends System {
    public loadScriptResource?: (resourceID: string) => Promise<string>;
    private _messageQueue: Array<{recipient: PlayerGroup, message: string}>;
    private _scriptwiseSystem: ScriptwiseSystem;
    constructor() {
        super();
        this._messageQueue = [];
        this._scriptwiseSystem = new ScriptwiseSystem(
            path.join(__dirname, "../../__scripted__/"), [
                "./aspect.ts",
                "./entity-manager-interface.ts",
                "./entity-manager-module-interface.ts",
                "./entity-manager.ts",
                "./entity.ts",
                "./module.ts",
                "./position.ts",
                "./scripted-server-subsystem.ts",
                "./aspect.ts",
                "./control.ts",
                "./default-control.ts",
                "./aspect-array.ts",
                "./velocity.ts",
                "./collision-box.ts"
            ]
        );
    }
    public update() {
        this._scriptwiseSystem.execute("./scripted-server-subsystem", "update");
        const result = this._scriptwiseSystem.runPostScript("./scripted-server-subsystem",
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
        const entID = this._scriptwiseSystem.execute("./scripted-server-subsystem", "createEntity");
        this._scriptwiseSystem.execute(
            "./scripted-server-subsystem",
            "createModule",
            entID,
            "position",
            "position",
            Math.random() * 150,
            Math.random() * 150
        );
        this._scriptwiseSystem.execute(
            "./scripted-server-subsystem",
            "createModule",
            entID,
            "velocity",
            "velocity",
            0,
            0
        );
        this._scriptwiseSystem.execute(
            "./scripted-server-subsystem",
            "createModule",
            entID,
            "default-control",
            "control"
        );
        player!.controllingEntity = entID;
    }
    public handleKeyInput(key: number, state: number, player: Player) {
        const input = player!.convertInput(key);
        this._scriptwiseSystem.execute(
            "./scripted-server-subsystem",
            "handleInput",
            player!.controllingEntity,
            input,
            state
        );
    }
    public createEntityAt(prefabID: string, x: number, y: number, player: Player) {
        const entID = this._scriptwiseSystem.execute("./scripted-server-subsystem", "createEntity");
        this._scriptwiseSystem.execute(
            "./scripted-server-subsystem",
            "createModule",
            entID,
            "position",
            "position",
            x,
            y
        );
    }
    public deleteEntity(id: number) {
        this._scriptwiseSystem.execute("./scripted-server-subsystem", "deleteEntity", id);
    }
    public setPlayerEntityWatch(player: Player, entityID?: number) {
        this._scriptwiseSystem.execute("./scripted-server-subsystem", "watchEntity", player.id, entityID);
    }
    public removeComponent(componentID: number) {
        this._scriptwiseSystem.execute(
            "./scripted-server-subsystem",
            "deleteModule",
            componentID
        );
    }
    public async runResourcePlayerScript(resourceID: string, args: string, player: Player, entityID?: number) {
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
    public async runPlayerScript(code: string, args: string, player: Player, entityID?: number, className?: string) {
        let thisValue: IVM.Reference<any> | undefined;
        if (entityID !== undefined) {
            thisValue = this._scriptwiseSystem.executeReturnRef(
                "./scripted-server-subsystem",
                "getEntity",
                entityID
            );
        }
        const script = await this._scriptwiseSystem.runPlayerScript(code, args, thisValue);
        const defaultExport = script.getReference("default");
        if (defaultExport.typeof !== "undefined" && className !== undefined) {
            this._scriptwiseSystem.execute(
                "./scripted-server-subsystem",
                "setModuleClass",
                defaultExport.derefInto(),
                className
            );
            if (entityID !== undefined) {
                this._scriptwiseSystem.execute(
                    "./scripted-server-subsystem",
                    "createModule",
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
