import Client from "core/client";
import IDGenerator from "core/id-generator";
import Manager from "core/manager";
import { UploadedFile } from "express-fileupload";
import ResourceServer from "networking/resource-server";
import TokenGenerator from "networking/token-generator";
import path from "path";
import Resource, { ResourceType } from "resource-management/resource";

import System from "./system";

interface ResourceSystemOptions {
    serverPort: string;
    resourcePath: string;
}

interface PlayerResourceData {
    resources: Map<string, string>;
}

export default class ResourceSystem extends System {
    public onPlayerListingUpdate?: (user: Client, resources: Resource[]) => void;
    public playerByUsername?: (username: string) => Client | undefined;
    private _playerResourceData: Map<string, PlayerResourceData> = new Map<string, PlayerResourceData>();
    private _resourceManager: Manager<Resource>;
    private _resourceServer: ResourceServer;
    private _playerTokens: Map<number, Client>;
    private _idGenerator: IDGenerator;
    constructor(idGenerator: IDGenerator, options: ResourceSystemOptions) {
        super();
        this._resourceCreate = this._resourceCreate.bind(this);
        this._onResourceDelete = this._onResourceDelete.bind(this);
        this._resourceManager = new Manager<Resource>(this._resourceCreate, this._onResourceDelete);
        this._resourceServer = new ResourceServer({port: options.serverPort, resourcePath: options.resourcePath});
        this._playerTokens = new Map<number, Client>();
        this._resourceServer.onFileUpload = this.handleFileUpload;
        this._resourceServer.onFileDelete = this.handleFileDelete;
        this._idGenerator = idGenerator;
    }
    public addResource(user: string, type: ResourceType, file: UploadedFile): Promise<Resource> {
        let playerResourceData = this._playerResourceData.get(user);
        if (playerResourceData === undefined) {
            playerResourceData = {resources: new Map<string, string>()};
            this._playerResourceData.set(user, playerResourceData);
        }
        const filename = this._getAvailableFilename(file.name, playerResourceData.resources);
        const resource = this._resourceManager.create(
            this._idGenerator.makeFrom("R", Date.now(), Math.random()),
            type,
            this._filenameToName(filename),
            filename,
            user,
            user,
            "",
            Date.now(),
            ""
        );
        playerResourceData.resources.set(filename, resource.id);
        this._updateResourceListing(user, this._collectPlayerResources(user));
        return this._resourceServer.add(resource, file);
    }
    public async updateResource(
            user: string,
            type: ResourceType,
            resourceID: string,
            file: UploadedFile): Promise<Resource> {
        const resource = this._resourceManager.get(resourceID);
        if (resource === undefined) {
            return Promise.reject(`Resource of ID \'${resourceID}\' does not exist`);
        }
        const owner = resource.owner;
        const playerResourceData = this._playerResourceData.get(owner);
        if (owner !== user || playerResourceData === undefined) {
            // TODO: Allow admins to edit resources they don't own
            return Promise.reject(`User ${user} does not have priveleges to edit this resource`);
        }
        playerResourceData.resources.delete(resource.filename);
        // Update the type just in case they uploaded something different
        resource.type = type;
        resource.time = Date.now();
        resource.filename = this._getAvailableFilename(file.name, playerResourceData.resources);
        playerResourceData.resources.set(resource.filename, resource.id);
        // TODO: Allow resources to have multiple contributors (owners)
        this._updateResourceListing(owner, this._collectPlayerResources(owner));
        return this._resourceServer.update(resource, file);
    }
    public deleteResource(user: string, resourceID: string): void {
        const resource = this._resourceManager.get(resourceID);
        if (resource === undefined) {
            throw new Error(`Resource of ID \'${resourceID}\' does not exist`);
        }
        const owner = resource.owner;
        if (owner !== user) {
            // TODO: Allow admins to edit resources they don't own
            throw new Error(`User ${user} does not have priveleges to delete other players' resources`);
        }
        this._resourceManager.queueForDeletion(resourceID);
    }
    public handleFileUpload = (token: number, file: UploadedFile, resourceID?: string) => {
        const player = this.getPlayerFromToken(token);
        if (player === undefined) {
            throw new Error("Invalid token");
        }
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
            case "audio/wav": {
                // Change mimetype to mpeg if it's mp3
                if (file.mimetype === "audio/mp3") {
                    file.mimetype = "audio/mpeg";
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
                throw new Error("File type not supported.");
            }
        }
        if (resourceType !== undefined) {
            if (resourceID === undefined) {
                // Upload new resource
                this.addResource(player.username, resourceType, file);
            }
            else {
                // Update resource (overwrite)
                this.updateResource(player.username, resourceType, resourceID, file);
            }
        }
    }
    public updateResourceData(username: string, resourceID: string, attribute: string, value: string) {
        const resource = this.getResourceByID(resourceID);
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
            default: {
                throw new Error(`Resource attribute ${attribute} is not recognized as a valid modifiable attribute`);
            }
        }
        this._updateResourceListing(owner, this._collectPlayerResources(owner));
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
    public loadTextResource(resourceID: string) {
        return this._resourceServer.loadTextResource(resourceID);
    }
    public getResourceByID(resourceID: string) {
        return this._resourceManager.get(resourceID);
    }
    public deleteQueued() {
        this._resourceManager.deleteQueued();
    }
    public getResourceByFilename(filename: string, playerUsername: string) {
        const playerResourceData = this._playerResourceData.get(playerUsername);
        if (playerResourceData === undefined) {
            return undefined;
        }
        return playerResourceData.resources.get(filename);
    }
    private _updateResourceListing(owner: string, resources: Resource[]) {
        if (this.playerByUsername !== undefined) {
            const player = this.playerByUsername(owner);
            if (player !== undefined && this.onPlayerListingUpdate !== undefined) {
                this.onPlayerListingUpdate(player, resources);
            }
        }
    }
    private _collectPlayerResources(owner: string): Resource[] {
        const resourceData = this._playerResourceData.get(owner);
        if (resourceData === undefined) {
            return [];
        }
        return Array.from(resourceData.resources.values()).map((resID) => this._resourceManager.get(resID)!);
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
            icon: string) {
        return new Resource(id, type, name, filename, creator, owner, description, time, icon);
    }
    private _onResourceDelete(resource: Resource) {
        const ownerData = this._playerResourceData.get(resource.owner);
        if (ownerData !== undefined) {
            ownerData.resources.delete(resource.filename);
        }
        this._resourceServer.delete(resource);
        this._updateResourceListing(resource.owner, this._collectPlayerResources(resource.owner));
    }
    private _filenameToName(filename: string) {
        const ext = path.extname(filename);
        return filename.substr(0, filename.length - ext.length);
    }
    private _getAvailableFilename(filename: string, fileMap: Map<string, string>) {
        const ext = path.extname(filename);
        const fileWithoutExt = filename.substr(0, filename.length - ext.length);
        let tryFilename = fileWithoutExt + ext;
        let num = 1;
        while (fileMap.get(tryFilename) !== undefined) {
            tryFilename = fileWithoutExt + "." + (num++) + ext;
            if (num > 100000) {
                throw new Error("Maximum filename renumbering attempts exceeded");
            }
        }
        return tryFilename;
    }
}
