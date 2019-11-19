import Client from "core/client";
import Group, { GroupType } from "core/group";
import Collection from "database/collection";
import fs from "fs-extra";
import IVM from "isolated-vm";
import _ from "lodash";
import path from "path";
import Resource from "resource-management/resource";
import Script from "scripting/script";
import ScriptCollection from "scripting/script-collection";

import System from "./system";

export default class GameSystem extends System {
    // TODO: Make this automatically query the scripts folder
    // Both for compilation and for module resolution
    public static readonly scriptedServerSubsystemDir = path.join(
        process.cwd(),
        "./__scripted__/",
        "./scripted-server-subsystem.ts"
    );
    public getResourceByID?: (id: string) => Promise<Resource | undefined>;
    public getPlayerResources?: (username: string) => Promise<Resource[]>;
    public loadResource?: (resourceID: string, encoding: string) => Promise<string>;
    public loadResourceSync?: (resourceID: string, encoding: string) => string;
    private _messageQueue: Array<{recipient: string[], message: string}>;
    private _scriptCollection: ScriptCollection;
    private _cachedPlayerScripts: Map<string, {time: number, script: Script}>;
    private _scriptDir: string;
    private _playerScriptDir: string;
    private _validPlayerModules: {[name: string]: string};
    private _mapDBCollection: Collection;
    private _mapLoaded: boolean = false;
    constructor(
            tickRate: number,
            systemScriptDirectory: string,
            playerScriptDirectory: string,
            mapCollection: Collection) {
        super();
        this._resolveModule = this._resolveModule.bind(this);
        this.updateResources = this.updateResources.bind(this);
        this._messageQueue = [];
        this._scriptDir = systemScriptDirectory;
        this._playerScriptDir = playerScriptDirectory;
        this._mapDBCollection = mapCollection;
        this._cachedPlayerScripts = new Map<string, {time: number, script: Script}>();

        const playerFileDirs = this._getDirsRecursive(this._playerScriptDir);
        const fileDirs = playerFileDirs.concat(
            this._getDirsRecursive(this._scriptDir, [this._playerScriptDir])
        );

        const scripts: {[s: string]: string} = _.transform(fileDirs, (result, dir) => {
            result[dir] = fs.readFileSync(dir, {encoding: "utf8"});
        }, {} as {[s: string]: string});

        this._validPlayerModules = playerFileDirs.reduce((result, dir) => {
            const relativePath = path.relative(this._playerScriptDir, dir);
            result[relativePath] = dir;
            return result;
        }, {} as {[name: string]: string});

        this._scriptCollection = new ScriptCollection(scripts);
        const builtScripts = this._scriptCollection.getScripts();
        for (const [scriptPath, script] of builtScripts) {
            if (scriptPath !== GameSystem.scriptedServerSubsystemDir) {
                const scriptName = path.relative(this._scriptDir, scriptPath);
                const scriptNameNoExt = scriptName.substr(0, scriptName.length - path.extname(scriptPath).length)
                    .replace("\\", "/");
                this._scriptCollection.execute(
                    GameSystem.scriptedServerSubsystemDir,
                    "setComponentClass",
                    [
                        script.getReference("default").derefInto(),
                        scriptNameNoExt,
                        false
                    ]
                );
            }
        }
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "initialize", [tickRate]);
    }
    public update() {
        const profile = process.hrtime();
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
        const totalTime = process.hrtime(profile);

        return result;
    }
    public recover() {
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "recoverFromTimeout");
    }
    public async createPlayer(client: Client) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createPlayer",
            [
                client.id,
                client.username,
                client.displayName
            ]
        );
        const entID = this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createEntity",
            [client.id]
        );
        // Creating the entity is temporary
        // Until players can add default modules on their own
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "position",
                "position",
                client.id,
                0,
                0
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "velocity",
                "velocity",
                client.id,
                0,
                0
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                    entID,
                "player-control",
                "control",
                client.id
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "display",
                "display",
                client.id,
                "R000000000000000000000002"
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "default-player-ac",
                "animation-controller",
                client.id
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "collision-box",
                "collision-box",
                client.id,
                0,
                0,
                32,
                32,
                false
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "gravity",
                "gravity",
                client.id,
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "hurtable",
                "hurtable",
                client.id,
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "basic-attack",
                "basic-attack",
                client.id,
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "sound-emitter",
                "sound-emitter",
                client.id,
            ]
        );
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "setPlayerControllingEntity",
            [
                client.id,
                entID
            ]
        );
    }
    public deletePlayer(client: Client) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "deletePlayer",
            [client.id]
        );
    }
    public handleKeyInput(key: number, state: number, client: Client) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "handleInput",
            [
                client.id,
                key,
                state
            ]
        );
    }
    public async createEntityAt(prefabID: string, x: number, y: number, client: Client) {
        const entID = this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createEntity",
            [client.id]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "position",
                "position",
                client.id,
                x,
                y
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "display",
                "display",
                client.id
            ]
        );
        await this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "createComponent",
            [
                entID,
                "collision-box",
                "collision-box",
                client.id,
                0,
                0,
                32,
                32,
                true,
                true
            ]
        );
    }
    public deleteEntity(id: string) {
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "deleteEntity", [id]);
    }
    public setPlayerEntityInspection(player: Client, entityID?: string) {
        this._scriptCollection.execute(GameSystem.scriptedServerSubsystemDir, "inspectEntity", [player.id, entityID]);
    }
    public removeComponent(componentID: string) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "deleteComponent",
            [componentID]
        );
    }
    public async runResourcePlayerScript(
            resourceID: string,
            args: string,
            client: Client,
            entityID?: string) {
        try {
            // TODO: Change async functions to be more careful about using things that may be deleted
            const resource = await this.getResourceByID!(resourceID);
            const code = await this._loadScriptResource(resourceID);
            const scripts = await this.runPlayerScript(
                resource!.filename,
                code,
                args,
                client,
                entityID,
                resourceID
            );
            _.each(scripts, async (script, scriptPath) => {
                const resources = (await this.getPlayerResources!(client.username)).reduce((result, playerRes) => {
                    result[playerRes.filename] = playerRes;
                    return result;
                }, {} as {[filename: string]: Resource});
                this._cachedPlayerScripts.set(resources[scriptPath].id, {time: Date.now(), script});
                if (script.result !== undefined) {
                    this.addMessageToQueue([client.id], `Script ${scriptPath} result: ${script.result}`);
                }
            });
        }
        catch (err) {
            this.addMessageToQueue([client.id],
                `<${err.stack}>`
            );
        }
    }
    public async runGenericPlayerScript(script: string, client: Client) {
        try {
            const result = (await this.runPlayerScript("", script, "", client))[""].result;
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
    public async runPlayerScript(
            filename: string,
            code: string,
            args: string,
            client: Client,
            entityID?: string,
            className?: string) {
        let apply = true;
        let entityValue: IVM.Reference<any> | undefined;
        if (entityID === undefined) {
            // Provide the player's controlling entity automatically
            // But don't apply to it
            apply = false;
            entityID = this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "getPlayerControllingEntity",
                [client.id]
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
        const resources = (await this.getPlayerResources!(client.username)).reduce((result, resource) => {
            result[resource.filename] = resource;
            return result;
        }, {} as {[filename: string]: Resource});
        const builtScripts = this._scriptCollection.buildScripts(
            {[filename]: code},
            (module) => this._preresolveModule(module, resources)
        );
        const scripts = this._scriptCollection.runScripts(
            builtScripts,
            args,
            entityValue,
            playerValue,
            (module) => this._resolveModule(builtScripts, module, resources),
        );
        const defaultExport = scripts[filename].getReference("default");
        if (defaultExport.typeof !== "undefined" && className !== undefined) {
            this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "setComponentClass",
                [
                    defaultExport.derefInto(),
                    className
                ]
            );
            if (apply) {
                this._scriptCollection.execute(
                    GameSystem.scriptedServerSubsystemDir,
                    "createComponent",
                    [
                        entityID,
                        className,
                        className,
                        client.id
                    ]
                );
            }
        }
        return scripts;
    }

    public addMessageToQueue(clients: string[], message: string) {
        this._messageQueue.push({recipient: clients, message});
    }

    public setPlayerControl(client: Client, entityID?: string) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "setPlayerControllingEntity",
            [
                client.id,
                entityID
            ]
        );
    }

    public setComponentEnableState(componentID: string, state: boolean) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "setComponentEnableState",
            [
                componentID,
                state
            ]
        );
    }

    public updateResources(player: Client, resources: {[filename: string]: Resource}) {
        this._scriptCollection.execute(
            GameSystem.scriptedServerSubsystemDir,
            "setResourceList",
            [
                player.id,
                this._scriptCollection.convert(resources)
            ]
        );
    }

    public async saveMap() {
        await this._scriptCollection.executeAsync(
            GameSystem.scriptedServerSubsystemDir,
            "serializeGameState"
        );
        const map = this._scriptCollection.runIVMScript(GameSystem.scriptedServerSubsystemDir,
            `
                new IVM.ExternalCopy(global.serializedMap).copyInto();
            `).result.serializedData;
        await this._mapDBCollection.drop();
        await this._mapDBCollection.insert({id: "scriptbox-map", map});
        this.addMessageToQueue([], `Map saved at ${new Date().toString()}. (${map.objects.length} objects)`);
        console.log(`Map saved at ${new Date().toString()}. (${map.objects.length} objects)`);
    }

    public async loadMap() {
        this._mapLoaded = true;
        const query = await this._mapDBCollection.get("scriptbox-map");
        if (query !== undefined && query !== null) {
            const skip = new Set<string>(["array"]);
            const modulesToLoad = query.map.objects.reduce((acc: Set<string>, obj: any) => {
                if (!acc.has(obj.module) && !skip.has(obj.module)) {
                    if (obj.module !== undefined) {
                        const tryLoadDir = path.join(this._scriptDir, obj.module);
                        if (this._scriptCollection.getScript(tryLoadDir + ".ts") === undefined) {
                           acc.add(obj.module);
                        }
                        else {
                            skip.add(obj.module);
                        }
                    }
                }
                return acc;
            }, new Set<string>()) as Set<string>;
            const modules = Array.from(modulesToLoad.values());
            console.log(`Building existing modules...`);
            for (const module of modules) {
                try {
                    const resource = await this.getResourceByID!(module);
                    const script = await this._loadScriptResource(resource!.id);
                    const ownerResourceList =
                        (await this.getPlayerResources!(resource!.creator)).reduce((acc, file) => {
                            acc[file.filename] = file;
                            return acc;
                        }, {} as {[filename: string]: Resource});
                    const builtScripts = this._scriptCollection.buildScripts(
                        {[resource!.filename]: script},
                        (resolvingModule) => this._preresolveModule(resolvingModule, ownerResourceList)
                    );
                    const scripts = this._scriptCollection.runScripts(
                        builtScripts,
                        "",
                        undefined,
                        undefined,
                        (resolvingModule) => this._resolveModule(builtScripts, resolvingModule, ownerResourceList),
                    );
                    const defaultExport = scripts[resource!.filename].getReference("default");
                    if (defaultExport.typeof !== "undefined" && resource!.id !== undefined) {
                        this._scriptCollection.execute(
                            GameSystem.scriptedServerSubsystemDir,
                            "setComponentClass",
                            [
                                defaultExport.derefInto(),
                                resource!.id
                            ]
                        );
                    }
                }
                catch (err) {
                    console.log(err);
                }
            }
            console.log(`Modules built.`);
            await this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "deserializeGameState",
                [new IVM.ExternalCopy(query.map).copyInto()],
                18000
            );
            this.addMessageToQueue([], `Map loaded. (${query.map.objects.length} objects)`);
            console.log(`Map loaded. (${query.map.objects.length} objects)`);
        }
        else {
            console.log(`No map available to load. Generating default map.`);
            this._generateMap();
        }
    }

    private _generateMap() {
        for (let i = -25; i < 25; i++) {
            const entID = this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "createEntity",
            );
            this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "createComponent",
                [
                    entID,
                    "position",
                    "position",
                    undefined,
                    i * 32,
                    32
                ]
            );
            this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "createComponent",
                [
                    entID,
                    "display",
                    "display",
                    undefined,
                    "R000000000000000000000003",
                    32,
                    0,
                    32,
                    32
                ]
            );
            this._scriptCollection.execute(
                GameSystem.scriptedServerSubsystemDir,
                "createComponent",
                [
                    entID,
                    "collision-box",
                    "collision-box",
                    undefined,
                    0,
                    0,
                    32,
                    32,
                    true
                ]
            );
            for (let j = 2; j < 8; j++) {
                const entID2 = this._scriptCollection.execute(
                    GameSystem.scriptedServerSubsystemDir,
                    "createEntity",
                );
                this._scriptCollection.execute(
                    GameSystem.scriptedServerSubsystemDir,
                    "createComponent",
                    [
                        entID2,
                        "position",
                        "position",
                        undefined,
                        i * 32,
                        j * 32
                    ]
                );
                this._scriptCollection.execute(
                    GameSystem.scriptedServerSubsystemDir,
                    "createComponent",
                    [
                        entID2,
                        "display",
                        "display",
                        undefined,
                        "R000000000000000000000003",
                        32,
                        32,
                        32,
                        32
                    ]
                );
                this._scriptCollection.execute(
                    GameSystem.scriptedServerSubsystemDir,
                    "createComponent",
                    [
                        entID2,
                        "collision-box",
                        "collision-box",
                        undefined,
                        0,
                        0,
                        32,
                        32,
                        true
                    ]
                );
            }
        }
    }

    private _preresolveModule(modulePath: string, resourcesByFilename: {[filename: string]: Resource}) {
        let pathsToTry = [modulePath];
        const extension = path.extname(modulePath);
        if (extension === "") {
            const assumedFiletypes = [".ts", ".js"];
            pathsToTry = pathsToTry.concat(assumedFiletypes.map((ext) => modulePath + ext));
        }
        for (const tryPath of pathsToTry) {
            if (this._validPlayerModules[tryPath] !== undefined) {
                return;
            }
        }
        // Trying to resolve to a default module failed
        // Now we should see if it's a user module instead
        for (const tryPath of pathsToTry) {
            const res = resourcesByFilename[path.relative(".", tryPath)];
            if (res !== undefined) {
                const cachedScript = this._cachedPlayerScripts.get(res.id);
                if (cachedScript !== undefined && cachedScript.time >= res.time) {
                    return;
                }
                else {
                    return [path.relative(".", tryPath), this._loadScriptResourceSync(res.id)] as [string, string];
                }
            }
        }
    }

    private _resolveModule(
            buildingScripts: {[path: string]: IVM.Module},
            modulePath: string,
            resourcesByFilename: {[filename: string]: Resource}) {
        let pathsToTry = [modulePath];
        const extension = path.extname(modulePath);
        if (extension === "") {
            const assumedFiletypes = [".ts", ".js"];
            pathsToTry = pathsToTry.concat(assumedFiletypes.map((ext) => modulePath + ext));
        }
        else if (![".ts", ".js"].includes(extension)) {
            throw new Error("Modules with extension \"" + extension + "\" are not supported using require.");
        }
        for (const tryPath of pathsToTry) {
            if (this._validPlayerModules[tryPath] !== undefined) {
                return this._scriptCollection.getScript(this._validPlayerModules[tryPath]).module;
            }
        }
        // Trying to resolve to a default module failed
        // Now we should see if it's a user module instead
        for (const tryPath of pathsToTry) {
            const res = resourcesByFilename[path.relative(".", tryPath)];
            if (res !== undefined) {
                const cachedScript = this._cachedPlayerScripts.get(res.id);
                if (cachedScript !== undefined) {
                    return cachedScript.script.module;
                }
            }
        }
        // Finally we check if it's a module that's being built alongside this one
        for (const tryPath of pathsToTry) {
            const res = resourcesByFilename[path.relative(".", tryPath)];
            if (res !== undefined) {
                const buildingScript = buildingScripts[path.relative(".", tryPath)];
                if (buildingScript !== undefined) {
                    return buildingScript;
                }
            }
        }
        throw new Error("No module \"" + modulePath + "\" is available.");
    }

    private _getDirsRecursive(dir: string, exclude: string[] = []) {
        return fs.readdirSync(dir).reduce((result, elemPath) => {
            const fullPath = path.join(dir, elemPath);
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
                result.push(fullPath);
            }
            else if (stats.isDirectory() && !exclude.includes(fullPath)) {
                result = result.concat(this._getDirsRecursive(fullPath, exclude));
            }
            return result;
        }, [] as string[]);
    }

    private async _loadScriptResource(id: string) {
        return await this.loadResource!(id, "utf8");
    }

    private _loadScriptResourceSync(id: string) {
        return this.loadResourceSync!(id, "utf8");
    }

    get mapLoaded() {
        return this._mapLoaded;
    }
}
