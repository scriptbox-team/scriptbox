import Client from "core/client";
import Group, { GroupType } from "core/group";
import fs from "fs-extra";
import IVM from "isolated-vm";
import _ from "lodash";
import path from "path";
import ScriptCollection from "scripting/script-collection";

import System from "./system";

export default class GameSystem extends System {
    public loadScriptResource?: (resourceID: string) => Promise<string>;
    private _messageQueue: Array<{recipient: string[], message: string}>;
    private _scriptCollection: ScriptCollection;
    constructor(tickRate: number) {
        super();
        this._messageQueue = [];
        const fileDirs = [
            "./aspect-array.ts",
            "./aspect.ts",
            "./collision-box.ts",
            "./component-info.ts",
            "./component.ts",
            "./control.ts",
            "./default-control.ts",
            "./entity.ts",
            "./existable.ts",
            "./export-values.ts",
            "./group.ts",
            "./id-generator.ts",
            "./manager.ts",
            "./meta-info.ts",
            "./player-soul.ts",
            "./player.ts",
            "./position.ts",
            "./proxy-generator.ts",
            "./scripted-server-subsystem.ts",
            "./velocity.ts"
        ];
        const baseScriptDir = path.join(__dirname, "../../__scripted__/");

        const scripts: any = _.transform(fileDirs, (result, value) => {
            result[value.substr(0, value.length - 3)] = fs.readFileSync(
                path.join(baseScriptDir, value),
                {encoding: "utf8"});
        }, {} as {[s: string]: string});

        this._scriptCollection = new ScriptCollection(scripts);
        this._scriptCollection.execute("./scripted-server-subsystem", "initialize", tickRate);
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
    public recover() {
        this._scriptCollection.execute("./scripted-server-subsystem", "recoverFromTimeout");
    }
    public createPlayer(client: Client) {
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createPlayer",
            client.id,
            client.username,
            client.displayName
        );
        const entID = this._scriptCollection.execute("./scripted-server-subsystem", "createEntity", client.id);
        // Creating the entity is temporary
        // Until players can add default modules on their own
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createComponent",
            entID,
            "position",
            "position",
            client.id,
            Math.random() * 150,
            Math.random() * 150
        );
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createComponent",
            entID,
            "velocity",
            "velocity",
            client.id,
            0,
            0
        );
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createComponent",
            entID,
            "default-control",
            "control",
            client.id
        );
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "setPlayerControllingEntity",
            client.id,
            entID
        );
    }
    public deletePlayer(client: Client) {
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "deletePlayer",
            client.id
        );
    }
    public handleKeyInput(key: number, state: number, client: Client) {
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "handleInput",
            client.id,
            key,
            state
        );
    }
    public createEntityAt(prefabID: string, x: number, y: number, player: Client) {
        const entID = this._scriptCollection.execute("./scripted-server-subsystem", "createEntity", player.id);
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
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
        this._scriptCollection.execute("./scripted-server-subsystem", "deleteEntity", id);
    }
    public setPlayerEntityInspection(player: Client, entityID?: string) {
        this._scriptCollection.execute("./scripted-server-subsystem", "inspectEntity", player.id, entityID);
    }
    public removeComponent(componentID: string) {
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
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
                "./scripted-server-subsystem",
                "getPlayerControllingEntity",
                client.id
            );
        }
        if (entityID !== undefined) {
            entityValue = this._scriptCollection.executeReturnRef(
                "./scripted-server-subsystem",
                "getEntity",
                entityID
            );
        }
        const playerValue = this._scriptCollection.executeReturnRef(
            "./scripted-server-subsystem",
            "getPlayer",
            client.id
        );
        const script = await this._scriptCollection.runScript(code, args, entityValue, playerValue);
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
            "./scripted-server-subsystem",
            "setPlayerControllingEntity",
            client.id,
            entityID
        );
    }

    public setComponentEnableState(componentID: string, state: boolean) {
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "setComponentEnableState",
            componentID,
            state
        );
    }
}
