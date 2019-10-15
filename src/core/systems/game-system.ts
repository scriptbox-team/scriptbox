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
    private _messageQueue: Array<{recipient: Group<Client>, message: string}>;
    private _scriptCollection: ScriptCollection;
    constructor() {
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
            "./id-generator.ts",
            "./manager.ts",
            "./meta-info.ts",
            "./player-group.ts",
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
    public createPlayer(client: Client) {
        const entID = this._scriptCollection.execute("./scripted-server-subsystem", "createEntity");
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "createPlayer",
            client.id,
            client.username,
            client.displayName
        );
        // Creating the entity is temporary
        // Until players can add default modules on their own
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
        this._scriptCollection.execute(
            "./scripted-server-subsystem",
            "setPlayerControllingEntity",
            client.id,
            entID
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
                    this.addMessageToQueue(new Group(GroupType.Only, [player]), `Script result: ${result}`);
                }
            }
        }
        catch (err) {
            this.addMessageToQueue(new Group(GroupType.Only, [player]),
                `<${err.stack}>`
            );
        }
    }
    public async runGenericPlayerScript(script: string, player: Client) {
        try {
            const result = await this.runPlayerScript(script, "", player);
            if (result !== undefined) {
                this.addMessageToQueue(
                    new Group(GroupType.Only, [player]),
                    `${script} Result: ${result}`
                );
            }
        }
        catch (err) {
            this.addMessageToQueue(new Group(GroupType.Only, [player]),
                `<${err.stack}>`
            );
            console.log(err);
        }
    }
    public async runPlayerScript(code: string, args: string, player: Client, entityID?: string, className?: string) {
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

    public addMessageToQueue(clientGroup: Group<Client>, message: string) {
        this._messageQueue.push({recipient: clientGroup, message});
    }
}
