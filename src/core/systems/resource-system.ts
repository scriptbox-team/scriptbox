import IDGenerator from "core/id-generator";
import Manager from "core/manager";
import Player from "core/player";
import { UploadedFile } from "express-fileupload";
import ResourceServer from "networking/resource-server";
import TokenGenerator from "networking/token-generator";
import Resource, { ResourceType } from "resource-management/resource";

import System from "./system";

interface IResourceSystemOptions {
    serverPort: string;
    resourcePath: string;
}

interface IPlayerResourceData {
    resources: string[];
}

export default class ResourceSystem extends System {
    public onPlayerListingUpdate?: (user: Player, resources: Resource[]) => void;
    public playerByUsername?: (username: string) => Player | undefined;
    private _playerResourceData: Map<string, IPlayerResourceData> = new Map<string, IPlayerResourceData>();
    private _resourceManager: Manager<Resource>;
    private _resourceServer: ResourceServer;
    private _playerTokens: Map<number, Player>;
    private _idGenerator: IDGenerator;
    constructor(idGenerator: IDGenerator, options: IResourceSystemOptions) {
        super();
        this.resourceCreate = this.resourceCreate.bind(this);
        this.onResourceDelete = this.onResourceDelete.bind(this);
        this._resourceManager = new Manager<Resource>(this.resourceCreate, this.onResourceDelete);
        this._resourceServer = new ResourceServer({port: options.serverPort, resourcePath: options.resourcePath});
        this._playerTokens = new Map<number, Player>();
        this._resourceServer.onFileUpload = this.handleFileUpload;
        this._resourceServer.onFileDelete = this.handleFileDelete;
        this._idGenerator = idGenerator;
    }
    public addResource(user: string, type: ResourceType, file: UploadedFile): Promise<Resource> {
        let playerResourceData = this._playerResourceData.get(user);
        if (playerResourceData === undefined) {
            playerResourceData = {resources: []};
            this._playerResourceData.set(user, playerResourceData);
        }
        const resource = this._resourceManager.create(
            this._idGenerator.makeFrom("R", Date.now(), Math.random()),
            type,
            file.name,
            user,
            user,
            "",
            Date.now(),
            ""
        );
        playerResourceData.resources.push(resource.id);
        this.updateResourceListing(user, this.collectPlayerResources(user));
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
        if (owner !== user) {
            // TODO: Allow admins to edit resources they don't own
            return Promise.reject(`User ${user} does not have priveleges to edit other players' resources`);
        }
        // Update the type just in case they uploaded something different
        resource.type = type;
        resource.time = Date.now();
        // TODO: Allow resources to have multiple contributors (owners)
        this.updateResourceListing(owner, this.collectPlayerResources(owner));
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
        // Update the type just in case they uploaded something different
        const ownerData = this._playerResourceData.get(owner);
        if (ownerData !== undefined) {
            ownerData.resources.splice(ownerData.resources.findIndex((id) => id === resourceID), 1);
        }
        this._resourceManager.queueForDeletion(resourceID);
        this.updateResourceListing(owner, this.collectPlayerResources(owner));
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
        this.updateResourceListing(owner, this.collectPlayerResources(owner));
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
    public makePlayerToken(player: Player) {
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
    private updateResourceListing(owner: string, resources: Resource[]) {
        if (this.playerByUsername !== undefined) {
            const player = this.playerByUsername(owner);
            if (player !== undefined && this.onPlayerListingUpdate !== undefined) {
                this.onPlayerListingUpdate(player, resources);
            }
        }
    }
    private collectPlayerResources(owner: string): Resource[] {
        const resourceData = this._playerResourceData.get(owner);
        if (resourceData === undefined) {
            return [];
        }
        return resourceData.resources.map((resID) => this._resourceManager.get(resID)!);
    }
    private resourceCreate(
            id: string,
            type: ResourceType,
            name: string,
            creator: string,
            owner: string,
            description: string,
            time: number,
            icon: string) {
        return new Resource(id, type, name, creator, owner, description, time, icon);
    }
    private onResourceDelete(resource: Resource) {
        this._resourceServer.delete(resource);
    }
}
