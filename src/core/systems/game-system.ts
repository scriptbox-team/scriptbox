import Client from "core/client";
import Group, { GroupType } from "core/group";
import fs from "fs-extra";
import IVM from "isolated-vm";
import _ from "lodash";
import path from "path";
import ScriptCollection from "scripting/script-collection";

import System from "./system";

export default class GameSystem extends System {
    // TODO: Make this automatically query the scripts folder
    // Both for compilation and for module resolution
    public static readonly scriptedServerSubsystemDir = path.join(
        process.cwd(),
        "./__scripted__/",
        "./scripted-server-subsystem"
    );
    public loadScriptResource?: (resourceID: string) => Promise<string>;
    private _messageQueue: Array<{recipient: string[], message: string}>;
    private _scriptCollection: ScriptCollection;
    private _scriptDir: string;
    constructor(tickRate: number) {
        super();
        this._resolveModule = this._resolveModule.bind(this);
        this._messageQueue = [];
        const fileDirs = [
            "./aspect-array",
            "./aspect",
            "./collision-box",
            "./component-info",
            "./component",
            "./control",
            "./default-control",
            "./entity",
            "./existable",
            "./export-values",
            "./group",
            "./id-generator",
            "./manager",
            "./meta-info",
            "./player-soul",
            "./player",
            "./position",
            "./proxy-generator",
            "./scripted-server-subsystem",
            "./velocity",
            "./exposed/component",
            "./exposed/default",
            "./exposed/entity"
        ];
        this._scriptDir = path.join(process.cwd(), "./__scripted__/");

        const scripts: any = _.transform(fileDirs, (result, value) => {
            const dir = path.join(this._scriptDir, value);
            result[dir] = fs.readFileSync(dir + ".ts", {encoding: "utf8"});
        }, {} as {[s: string]: string});

        this._scriptCollection = new ScriptCollection(scripts);
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "initialize", tickRate);
    }
    public update() {
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "update");
        const result = this._scriptCollection.runIVMScript(GameSystem.scriptedServerSubsystemDir,
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
    public recover() {
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "recoverFromTimeout");
    }
    public createPlayer(client: Client) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createPlayer",
            client.id,
            client.username,
            client.displayName
        );
        const entID = this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "createEntity", client.id);
        // Creating the entity is temporary
        // Until players can add default modules on their own
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            entID,
            "position",
            "position",
            client.id,
            Math.random() * 150,
            Math.random() * 150
        );
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            entID,
            "velocity",
            "velocity",
            client.id,
            0,
            0
        );
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            entID,
            "default-control",
            "control",
            client.id
        );
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "setPlayerControllingEntity",
            client.id,
            entID
        );
    }
    public deletePlayer(client: Client) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "deletePlayer",
            client.id
        );
    }
    public handleKeyInput(key: number, state: number, client: Client) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "handleInput",
            client.id,
            key,
            state
        );
    }
    public createEntityAt(prefabID: string, x: number, y: number, player: Client) {
        const entID = this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "createEntity", player.id);
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            entID,
            "position",
            "position",
            player.id,
            x,
            y
        );
    }
    public deleteEntity(id: string) {
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "deleteEntity", id);
    }
    public setPlayerEntityInspection(player: Client, entityID?: string) {
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "inspectEntity", player.id, entityID);
    }
    public removeComponent(componentID: string) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "deleteComponent",
            componentID
        );
    }
    public async runResourcePlayerScript(resourceID: string, args: string, player: Client, entityID?: string) {
        try {
            if (this.loadScriptResource !== undefined) {
                const script = await this.loadScriptResource(resourceID);
                const result = await this.runPlayerScript(script, args, player, entityID, resourceID);
                if (result !== undefined) {
                    this.addMessageToQueue([player.id], `Script result: ${result}`);
                }
            }
        }
        catch (err) {
            this.addMessageToQueue([player.id],
                `<${err.stack}>`
            );
        }
    }
    public async runGenericPlayerScript(script: string, client: Client) {
        try {
            const result = await this.runPlayerScript(script, "", client);
            if (result !== undefined) {
                this.addMessageToQueue(
                    [client.id],
                    `${script} Result: ${result}`
                );
            }
        }
        catch (err) {
            this.addMessageToQueue([client.id],
                `<${err.stack}>`
            );
            console.log(err);
        }
    }
    public async runPlayerScript(code: string, args: string, client: Client, entityID?: string, className?: string) {
        let entityValue: IVM.Reference<any> | undefined;
        if (entityID === undefined) {
            entityID = this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "getPlayerControllingEntity",
                client.id
            );
        }
        if (entityID !== undefined) {
            entityValue = this._scriptCollection.executeReturnRef(
                GameSystem.scriptedServerSubsystemDir,
                "getEntity",
                entityID
            );
        }
        const playerValue = this._scriptCollection.executeReturnRef(
            GameSystem.scriptedServerSubsystemDir,
            "getPlayer",
            client.id
        );
        const script = await this._scriptCollection.runScript(
            code,
            args,
            entityValue,
            playerValue,
            this._resolveModule
        );
        const defaultExport = script.getReference("default");
        if (defaultExport.typeof !== "undefined" && className !== undefined) {
            this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "setComponentClass",
                defaultExport.derefInto(),
                className
            );
            if (entityID !== undefined) {
                this._scriptCollection.execute(
                    GameSystem.scriptedServerSubsystemDir,
                    "createComponent",
                    entityID,
                    className,
                    className,
                    client.id
                );
            }
        }
        if (script.result !== undefined) {
            return script.result;
        }
        return undefined;
    }

    public addMessageToQueue(clients: string[], message: string) {
        this._messageQueue.push({recipient: clients, message});
    }

    public setPlayerControl(client: Client, entityID?: string) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "setPlayerControllingEntity",
            client.id,
            entityID
        );
    }

    public setComponentEnableState(componentID: string, state: boolean) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "setComponentEnableState",
            componentID,
            state
        );
    }

    private _resolveModule(modulePath: string) {
        const validModules: {[id: string]: string} = {
            component: "./exposed/entity",
            entity: "./exposed/entity",
            default: "./exposed/default"
        };
        if (validModules[modulePath] === undefined) {
            throw new Error("No module of name \"" + modulePath + "\" is available.");
        }
        return this._scriptCollection.getScript(path.join(this._scriptDir, validModules[modulePath])).module;
    }
}
