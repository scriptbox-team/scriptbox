import Client from "core/client";
import IDGenerator from "core/id-generator";
import Manager from "core/manager";
import Collection from "database/collection";
import fileType from "file-type";
import fs from "fs-extra";
import ResourceServer from "networking/resource-server";
import TokenGenerator from "networking/token-generator";
import path from "path";
import Resource, { ResourceType } from "resource-management/resource";

import System from "./system";

interface ResourceSystemOptions {
    serverPort: string;
    resourcePath: string;
}

interface TaggedResource extends Resource {
    tags: string[];
}

interface ResourceFile {
    name: string;
    data: Buffer;
    mimetype: string;
}

export default class ResourceSystem extends System {
    public playerByUsername?: (username: string) => Client | undefined;
    private _playerListingUpdateDelegates: Array<(user: Client, resources: Resource[]) => void>;
    private _resourceServer: ResourceServer;
    private _playerTokens: Map<number, Client>;
    private _idGenerator: IDGenerator;
    private _resourceCollection: Collection;
    private _resourceDeletionQueue: string[];
    constructor(idGenerator: IDGenerator, collection: Collection, options: ResourceSystemOptions) {
        super();
        this._resourceCreate = this._resourceCreate.bind(this);
        this._onResourceDelete = this._onResourceDelete.bind(this);
        this._resourceCollection = collection;
        this._resourceDeletionQueue = [];
        this._playerListingUpdateDelegates
            = new Array<(user: Client, resources: Resource[]) => void>();
        this._resourceServer = new ResourceServer({port: options.serverPort, resourcePath: options.resourcePath});
        this._playerTokens = new Map<number, Client>();
        this._resourceServer.onFileUpload = this.handleFileUpload;
        this._resourceServer.onFileDelete = this.handleFileDelete;
        this._idGenerator = idGenerator;
    }
    public async loadExistingResources(savedResourcePath: string, initialResourcePath?: string) {
        const existingResourceData: {[id: string]: {name: string}} = {
        };
        const resources = await this._getResources();
        const resourceIDSet = new Set<string>();
        if (resources.length !== 0) {
            for (const resource of resources) {
                const resourcePath = path.join(savedResourcePath, resource.id);
                const file = await fs.readFile(resourcePath);
                const type = fileType(file);
                resourceIDSet.add(resource.id);
                await this.addOrUpdateFile(
                    "scriptbox",
                    {
                        name: resource.filename,
                        mimetype: type !== undefined ? type.mime : "text/plain",
                        data: file
                    },
                    resource.id
                );
            }
        }
        if (initialResourcePath !== undefined) {
            const defaultResourcePaths = this._getDirsRecursive(initialResourcePath);
            for (const resourcePath of defaultResourcePaths) {
                const id = path.basename(resourcePath);
                const file = await fs.readFile(resourcePath);
                const type = fileType(file);
                if (!resourceIDSet.has(id)) {
                    const name = existingResourceData[id] !== undefined ? existingResourceData[id].name : id;
                    await this.addOrUpdateFile(
                        "scriptbox",
                        {
                            name,
                            mimetype: type !== undefined ? type.mime : "text/plain",
                            data: file
                        },
                        id,
                        true,
                        true
                    );
                }
            }
        }
        console.log("Resource data loaded.");
    }
    public async addResource(
            user: string,
            type: ResourceType,
            file: ResourceFile,
            id?: string,
            share: boolean = false): Promise<Resource> {
        const playerResourceData = await this.getPlayerResources(user);
        const filename = this._getAvailableFilename(file.name, playerResourceData);
        const resource = new Resource(
            id !== undefined ? id : this._idGenerator.makeFrom("R", Date.now(), Math.random()),
            type,
            this._filenameToName(filename),
            filename,
            user,
            user,
            "",
            Date.now(),
            "",
            share
        );
        await this._setResource(resource);
        await this._updateResourceListing(user, playerResourceData.concat([resource]));
        return await this._resourceServer.add(resource, file);
    }
    public async updateResource(
            user: string,
            type: ResourceType,
            resourceID: string,
            file: ResourceFile,
            share?: boolean): Promise<Resource> {
        const resource = await this.getResourceByID(resourceID);
        const playerResourceData = await this.getPlayerResources(user);
        if (resource === undefined) {
            return Promise.reject(`Resource of ID \'${resourceID}\' does not exist`);
        }
        const owner = resource.owner;
        if (owner !== user && user !== "scriptbox") {
            // TODO: Allow admins to edit resources they don't own
            return Promise.reject(`User ${user} does not have priveleges to edit this resource`);
        }
        // Update the type just in case they uploaded something different
        resource.type = type;
        resource.time = Date.now();

        if (share !== undefined) {
            resource.shared = share;
        }

        if (resource.filename !== file.name) {
            resource.filename = this._getAvailableFilename(file.name, playerResourceData);
        }
        await this._updateResource(resource);
        // TODO: Allow resources to have multiple contributors (owners)
        await this._updateResourceListing(owner, playerResourceData);
        return this._resourceServer.update(resource, file);
    }
    public async deleteResource(user: string, resourceID: string): Promise<void> {
        const resource = await this.getResourceByID(resourceID);
        if (resource === undefined) {
            throw new Error(`Resource of ID \'${resourceID}\' does not exist`);
        }
        const owner = resource.owner;
        if (owner !== user && user !== "scriptbox") {
            // TODO: Allow admins to edit resources they don't own
            throw new Error(`User ${user} does not have priveleges to delete other players' resources`);
        }
        this._resourceDeletionQueue.push(resourceID);
    }
    public async addOrUpdateFile(
            username: string,
            file: ResourceFile,
            resourceID?: string,
            alwaysCreate: boolean = false,
            share?: boolean) {
        let resourceType: ResourceType | undefined;
        switch (file.mimetype) {
            case "image/bmp":
            case "image/png":
            case "image/jpeg":
            case "image/gif": {
                resourceType = ResourceType.Image;
                break;
            }
            case "audio/midi audio/x-midi":
            case "audio/mpeg":
            case "audio/mp3":
            case "audio/ogg":
            case "audio/wav":
            case "audio/wave":
            case "audio/vnd.wave":
            case "audio/x-wav": {
                // Change mimetype to mpeg if it's mp3
                if (file.mimetype === "audio/mp3") {
                    file.mimetype = "audio/mpeg";
                }
                if (file.mimetype === "audio/vnd.wave" || file.mimetype === "audio/wave") {
                    file.mimetype = "audio/wav";
                }
                resourceType = ResourceType.Sound;
                break;
            }
            case "text/plain":
            case "text/javascript": {
                resourceType = ResourceType.Script;
                break;
            }
            default: {
                throw new Error(`File of media type ${file.mimetype} not supported.`);
            }
        }
        if (resourceType !== undefined) {
            if (resourceID === undefined || alwaysCreate) {
                // Upload new resource
                await this.addResource(username, resourceType, file, resourceID, share);
            }
            else {
                // Update resource (overwrite)
                await this.updateResource(username, resourceType, resourceID, file, share);
            }
        }
    }
    public handleFileUpload = async (token: number, file: ResourceFile, resourceID?: string) => {
        const player = this.getPlayerFromToken(token);
        if (player === undefined) {
            throw new Error("Invalid token");
        }
        return await this.addOrUpdateFile(player.username, file, resourceID);
    }
    public async updateResourceData(username: string, resourceID: string, attribute: string, value: string) {
        console.log(username + ", " + resourceID + "," + attribute + "," + value);
        const resource = await this.getResourceByID(resourceID);
        if (resource === undefined) {
            throw new Error(`Resource to modify was not found`);
        }
        const owner = resource.owner;
        if (owner !== username) {
            throw new Error(`User ${username} does not have priveleges to modify other players' resource data`);
        }
        switch (attribute) {
            case "name": {
                resource.name = value;
                break;
            }
            case "description": {
                resource.description = value;
                break;
            }
            case "shared": {
                resource.shared = value === "true";
                console.log(typeof resource.shared);
                break;
            }
            default: {
                throw new Error(`Resource attribute ${attribute} is not recognized as a valid modifiable attribute`);
            }
        }
        await this._updateResource(resource);
        const resourceData = await this.getPlayerResources(owner);
        if (resourceData !== undefined) {
            await this._updateResourceListing(owner, resourceData);
        }
    }
    public handleFileDelete = (token: number, resourceID: string) => {
        const player = this.getPlayerFromToken(token);
        if (player === undefined) {
            throw new Error("Invalid token");
        }
        this.deleteResource(player.username, resourceID);
    }
    public host() {
        this._resourceServer.host();
    }
    public makePlayerToken(player: Client) {
        const token = TokenGenerator.makeToken();
        this._playerTokens.set(token, player);
        return token;
    }
    public getPlayerFromToken(token: number) {
        return this._playerTokens.get(token);
    }
    public async playerRequestResource(resourceID: string, player: Client) {
        const resourceData = await this.getResourceByID(resourceID);
        if (resourceData.owner !== player.username || resourceData.type !== "script") {
            return undefined;
        }
        return await this.loadResource(resourceID, "utf8");
    }
    public async loadResource(resourceID: string, encoding: string) {
        return await this._resourceServer.loadResource(resourceID, encoding);
    }
    public loadResourceSync(resourceID: string, encoding: string) {
        return this._resourceServer.loadResourceSync(resourceID, encoding);
    }
    public async deleteQueued() {
        for (const resourceID of this._resourceDeletionQueue) {
            await this._deleteResource(resourceID);
            // Delete resource from database
        }
        this._resourceDeletionQueue = [];
    }
    public addPlayerListingDelegate(cb: (user: Client, resources: Resource[]) => void) {
        this._playerListingUpdateDelegates.push(cb);
    }
    public async sendPlayerListingUpdates(owner: string) {
        const playerResourceData = await this.getPlayerResources(owner);
        await this._updateResourceListing(owner, playerResourceData);
    }
    public async getResourceByFilename(username: string, filename: string): Promise<Resource> {
        return (await this._resourceCollection.getMany({owner: username, filename}))[0];
    }
    get port() {
        return this._resourceServer.port;
    }
    public async getResourceByID(resourceID: string): Promise<Resource> {
        return await this._resourceCollection.get(resourceID);
    }
    public async getPlayerResources(username: string): Promise<Resource[]> {
        return await this._resourceCollection.getMany({owner: username});
    }
    public async searchSharedResources(search: string) {
        const tags = search.toLowerCase().split(/\s+/);
        return await this._resourceCollection.getMany({
            shared: true,
            tags: {
                $in: tags
            }
        });
    }
    public async cloneResource(resourceID: string, user: string) {
        const resourceData = await this.getResourceByID(resourceID);
        if (resourceData !== undefined) {
            const file = Buffer.from(await this.loadResource(resourceID, "utf8"));
            const type = fileType(file);
            this.addOrUpdateFile(
                user,
                {
                    name: resourceData.filename,
                    data: file,
                    mimetype: type !== undefined ? type.mime : "text/plain",
                }
            );
        }
    }
    private async _updateResourceListing(owner: string, resources: Resource[]) {
        if (this.playerByUsername !== undefined) {
            const player = this.playerByUsername(owner);
            if (player !== undefined && this._playerListingUpdateDelegates !== undefined) {
                for (const func of this._playerListingUpdateDelegates) {
                    func(player, resources);
                }
            }
        }
    }
    private _resourceCreate(
            id: string,
            type: ResourceType,
            name: string,
            filename: string,
            creator: string,
            owner: string,
            description: string,
            time: number,
            icon: string,
            shared: boolean) {
        return new Resource(id, type, name, filename, creator, owner, description, time, icon, shared);
    }
    private async _onResourceDelete(resource: Resource) {
        this._resourceServer.delete(resource);
        await this._deleteResource(resource.id);
    }
    private _filenameToName(filename: string) {
        const ext = path.extname(filename);
        return filename.substr(0, filename.length - ext.length);
    }
    private _getAvailableFilename(filename: string, files: Resource[]) {
        const ext = path.extname(filename);
        const fileWithoutExt = filename.substr(0, filename.length - ext.length);
        let tryFilename = fileWithoutExt + ext;
        let num = 1;
        const set = new Set(files.map((file) => file.name));
        while (set.has(tryFilename)) {
            tryFilename = fileWithoutExt + "." + (num++) + ext;
            if (num > 100000) {
                throw new Error("Maximum filename renumbering attempts exceeded");
            }
        }
        return tryFilename;
    }
    private async _getResources(): Promise<TaggedResource[]> {
        return await this._resourceCollection.getMany({});
    }
    private async _setResource(resourceData: Resource) {
        await this._resourceCollection.insert(this._tagifyResource(resourceData));
    }
    private async _updateResource(resourceData: Resource) {
        await this._resourceCollection.update(resourceData.id, this._tagifyResource(resourceData));
    }
    private async _deleteResource(id: string) {
        await this._resourceCollection.delete(id);
    }
    private _tagifyResource(resourceData: Resource) {
        return Object.assign(
            {
                tags: Array.from(new Set([
                    ...resourceData.name.toLowerCase().split(/\s+/),
                    ...resourceData.description.toLowerCase().split(/\s+/)
                ]).values())
            },
            resourceData
        );
    }
    private _getDirsRecursive(dir: string) {
        return fs.readdirSync(dir).reduce((result, elemPath) => {
            const fullPath = path.join(dir, elemPath);
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
                result.push(fullPath);
            }
            else if (stats.isDirectory()) {
                result = result.concat(this._getDirsRecursive(fullPath));
            }
            return result;
        }, [] as string[]);
    }
}
