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

/**
 * A system of the server which handles resource changes and hosting. This will make changes to the
 * database when a resource is changed, added, or removed, and will notify the owner of the changes.
 * This also contains the ResourceServer which hosts the resources, and handles relevant calls
 * to the ResourceServer.
 *
 * @export
 * @class ResourceSystem
 * @extends {System}
 * @module core
 */
export default class ResourceSystem extends System {
    public playerByUsername?: (username: string) => Client | undefined;
    private _playerListingUpdateDelegates: Array<(user: Client, resources: Resource[]) => void>;
    private _resourceServer: ResourceServer;
    private _playerTokens: Map<number, Client>;
    private _idGenerator: IDGenerator;
    private _resourceCollection: Collection;
    private _resourceDeletionQueue: string[];
    /**
     * Creates an instance of ResourceSystem.
     * @param {IDGenerator} idGenerator The ID generator to use for Resource IDs
     * @param {Collection} collection The collection to use for storing resource information.
     * @param {ResourceSystemOptions} options A set of options for the resource system.
     * @memberof ResourceSystem
     */
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

        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.handleFileDelete = this.handleFileDelete.bind(this);
        this._resourceServer.onFileUpload = this.handleFileUpload;
        this._resourceServer.onFileDelete = this.handleFileDelete;
        this._idGenerator = idGenerator;

    }
    /**
     * Reload the existing resources.
     *
     * @param {string} savedResourcePath The path where the resource data is saved to.
     * @param {string} [initialResourcePath] A path of resources to load automatically.
     * @memberof ResourceSystem
     */
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
                    resource.id,
                    undefined,
                    undefined,
                    resource.type
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
    /**
     * Add a resource to the ResourceServer.
     *
     * @param {string} user The username of the resource owner.
     * @param {ResourceType} type The type of the resource.
     * @param {ResourceFile} file The file data of the resource.
     * @param {string} [id] The resource ID to use. If not defined, an ID will be generated.
     * @param {boolean} [isDefault=false] Whether the resource is a default resource or not.
     * @returns {Promise<Resource>} A promise which resolves to the added resource.
     * @memberof ResourceSystem
     */
    public async addResource(
            user: string,
            type: ResourceType,
            file: ResourceFile,
            id?: string,
            isDefault: boolean = false): Promise<Resource> {
        const playerResourceData = await this.getPlayerResources(user);
        const filename = this._getAvailableFilename(file.name, playerResourceData);
        const resource = new Resource(
            id !== undefined ? id : this._idGenerator.makeFrom("R", Date.now(), Math.random()),
            type,
            this._filenameToName(filename),
            filename,
            user,
            user,
            isDefault ? "A default resource" : "",
            Date.now(),
            "",
            isDefault
        );
        await this._setResource(resource);
        await this._updateResourceListing(user, playerResourceData.concat([resource]));
        return await this._resourceServer.add(resource, file);
    }
    /**
     * Update an existing resource in the ResourceServer.
     *
     * @param {string} user The username of the client making the request.
     * @param {ResourceType} type The type of the resource.
     * @param {string} resourceID The ID of the resource to update.
     * @param {ResourceFile} file The new file data of the resource.
     * @param {boolean} [isDefault=false] Whether the resource is a default resource or not.
     * @returns {Promise<Resource>} A promise which resolves to the updated resource.
     * @memberof ResourceSystem
     */
    public async updateResource(
            user: string,
            type: ResourceType,
            resourceID: string,
            file: ResourceFile,
            isDefault: boolean = false): Promise<Resource> {
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

        if (isDefault) {
            resource.shared = true;
        }

        if (resource.filename !== file.name) {
            resource.filename = this._getAvailableFilename(file.name, playerResourceData);
        }

        await this._updateResource(resource);
        // TODO: Allow resources to have multiple contributors (owners)
        await this._updateResourceListing(owner, playerResourceData);
        return this._resourceServer.update(resource, file);
    }
    /**
     * Delete an existing resource in the ResourceServer.
     *
     * @param {string} user The username of the client making the request.
     * @param {string} resourceID The ID of the resource to delete.
     * @returns {Promise<void>} A promise which resolves when the resource is deleted.
     * @memberof ResourceSystem
     */
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
    /**
     * Handle a general file upload operation, which may be either adding or updating a file.
     * This will automatically detect the resource type based on the MIME type.
     *
     * @param {string} username The username of the client making the request.
     * @param {ResourceFile} file The file that has been uploaded.
     * @param {string} [resourceID] The resource ID to assign the file to. If undefined, a new one will be made.
     * @param {boolean} [alwaysCreate=false] Whether the file should be forcibly created or not.
     * @param {boolean} [isDefault=false] Whether the resource is a default resource or not.
     * @param {ResourceType} [resourceType] If not undefined, force the resource type to this.
     * @returns A promise which resolves to the created or updated resource.
     * @memberof ResourceSystem
     */
    public async addOrUpdateFile(
            username: string,
            file: ResourceFile,
            resourceID?: string,
            alwaysCreate: boolean = false,
            isDefault: boolean = false,
            resourceType?: ResourceType) {
        if (resourceType === undefined) {
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
        }
        if (resourceType !== undefined) {
            if (resourceID === undefined || alwaysCreate) {
                // Upload new resource
                return await this.addResource(username, resourceType, file, resourceID, isDefault);
            }
            else {
                // Update resource (overwrite)
                return await this.updateResource(username, resourceType, resourceID, file, isDefault);
            }
        }
    }
    /**
     * Handle a file upload request from the HTTP server.
     * This will use the token to get a username.
     *
     * @param {number} token The token sent with the file upload.
     * @param {ResourceFile} file The uploaded file.
     * @param {string} [resourceID] The resource ID to use with the file.
     * @returns A promise which resolves to the created or updated resource.
     * @memberof ResourceSystem
     */
    public async handleFileUpload(token: number, file: ResourceFile, resourceID?: string) {
        const player = this.getPlayerFromToken(token);
        if (player === undefined) {
            throw new Error("Invalid token");
        }
        return await this.addOrUpdateFile(player.username, file, resourceID);
    }
    /**
     * Update the metadata to a resource.
     *
     * @param {string} username The username of the client making the request.
     * @param {string} resourceID The resource ID to edit.
     * @param {string} attribute The metadata attribute to change.
     * @param {string} value The value to change the attribute to.
     * @memberof ResourceSystem
     */
    public async updateResourceData(username: string, resourceID: string, attribute: string, value: string) {
        const resource = await this.getResourceByID(resourceID);
        const owner = resource.owner;
        if (resource === undefined) {
            throw new Error(`Resource to modify was not found`);
        }
        if (owner !== username) {
            throw new Error(`User ${username} does not have priveleges to modify other players' resource data`);
        }
        let resourceData = await this.getPlayerResources(owner);
        switch (attribute) {
            case "name": {
                resource.name = value;
                break;
            }
            case "description": {
                resource.description = value;
                break;
            }
            case "filename": {
                if (resource.filename !== value) {
                    resource.filename = this._getAvailableFilename(value, resourceData);
                }
                break;
            }
            case "shared": {
                resource.shared = value === "true";
                break;
            }
            default: {
                throw new Error(`Resource attribute ${attribute} is not recognized as a valid modifiable attribute`);
            }
        }
        await this._updateResource(resource);
        resourceData = await this.getPlayerResources(owner);
        if (resourceData !== undefined) {
            await this._updateResourceListing(owner, resourceData);
        }
    }
    /**
     * Handle a file deletion request from the HTTP server.
     * This will use the token to get a username.
     *
     * @param {number} token The token sent with the request.
     * @param {string} resourceID The ID of the resource to delete.
     * @memberof ResourceSystem
     */
    public handleFileDelete(token: number, resourceID: string) {
        const player = this.getPlayerFromToken(token);
        if (player === undefined) {
            throw new Error("Invalid token");
        }
        this.deleteResource(player.username, resourceID);
    }
    /**
     * Host the Resource HTTP server.
     *
     * @memberof ResourceSystem
     */
    public host() {
        this._resourceServer.host();
    }
    /**
     * Create a token for a client to use with the REST API.
     *
     * @param {Client} player The player to create a token for.
     * @returns The token associated with that player.
     * @memberof ResourceSystem
     */
    public makePlayerToken(player: Client) {
        const token = TokenGenerator.makeToken();
        this._playerTokens.set(token, player);
        return token;
    }
    /**
     * Get a client from a token.
     *
     * @param {number} token The token to get the client from
     * @returns The client if the token is valid, undefined if invalid.
     * @memberof ResourceSystem
     */
    public getPlayerFromToken(token: number) {
        return this._playerTokens.get(token);
    }
    /**
     * Get the text for a player's script resource.
     *
     * @param {string} resourceID The ID of the resource to load.
     * @param {Client} player The client to get the resource for.
     * @returns The code for the script resource.
     * @memberof ResourceSystem
     */
    public async playerRequestResource(resourceID: string, player: Client) {
        const resourceData = await this.getResourceByID(resourceID);
        if (resourceData.owner !== player.username || resourceData.type !== "script") {
            return undefined;
        }
        return await this.loadResource(resourceID, "utf8");
    }
    /**
     * Get the data for any resource.
     *
     * @param {string} resourceID The ID of the resource to load.
     * @param {string} encoding The encoding to use when loading the resource.
     * @returns A promise which resolves to the resource data as a string.
     * @memberof ResourceSystem
     */
    public async loadResource(resourceID: string, encoding: string) {
        return await this._resourceServer.loadResource(resourceID, encoding);
    }
    /**
     * Synchronously get the data for any resource.
     *
     * @param {string} resourceID The ID of the resource to load.
     * @param {string} encoding The encoding to use when loading the resource.
     * @returns The resource data as a string.
     * @memberof ResourceSystem
     */
    public loadResourceSync(resourceID: string, encoding: string) {
        return this._resourceServer.loadResourceSync(resourceID, encoding);
    }
    /**
     * Delete any resources which are queued for deletion.
     *
     * @memberof ResourceSystem
     */
    public async deleteQueued() {
        for (const resourceID of this._resourceDeletionQueue) {
            const currentRes = await this.getResourceByID(resourceID);
            if (currentRes !== undefined && currentRes !== null) {
                const owner = currentRes.owner;
                await this._deleteResource(resourceID);
                this.sendPlayerListingUpdates(owner);
            }
            // Delete resource from database
        }
        this._resourceDeletionQueue = [];
    }
    /**
     * Add a callback to be executed when a player's resource listing is updated.
     *
     * @param {(user: Client, resources: Resource[]) => void} cb The callback.
     * @memberof ResourceSystem
     */
    public addPlayerListingDelegate(cb: (user: Client, resources: Resource[]) => void) {
        this._playerListingUpdateDelegates.push(cb);
    }
    /**
     * Send a player their resource list updates.
     *
     * @param {string} owner The username of the client to send the resource list to.
     * @memberof ResourceSystem
     */
    public async sendPlayerListingUpdates(owner: string) {
        const playerResourceData = await this.getPlayerResources(owner);
        await this._updateResourceListing(owner, playerResourceData);
    }
    /**
     * Get a resource from a user's resource list by its filename.
     *
     * @param {string} username The username of the player to get the resource from.
     * @param {string} filename The filename of the resource
     * @returns {Promise<Resource>} A promise which resolves to the retrieved resource.
     * @memberof ResourceSystem
     */
    public async getResourceByFilename(username: string, filename: string): Promise<Resource> {
        return (await this._resourceCollection.getMany({owner: username, filename}))[0];
    }
    /**
     * The port the HTTP server is hosted on.
     *
     * @readonly
     * @memberof ResourceSystem
     */
    get port() {
        return this._resourceServer.port;
    }
    /**
     * Get a resource from its ID.
     *
     * @param {string} resourceID The ID of the resource to get.
     * @returns {Promise<Resource>} A promise which resolves to the fetched resource.
     * @memberof ResourceSystem
     */
    public async getResourceByID(resourceID: string): Promise<Resource> {
        return await this._resourceCollection.get(resourceID);
    }
    /**
     * Get all of the resources owned by a player.
     *
     * @param {string} username The username of the player to get the resources of.
     * @returns {Promise<Resource[]>} A promise which resolves to an array of resources owned by that player.
     * @memberof ResourceSystem
     */
    public async getPlayerResources(username: string): Promise<Resource[]> {
        return await this._resourceCollection.getMany({owner: username});
    }
    /**
     * Search for shared resources using a space-delimited search query.
     *
     * @param {string} search The search terms separated by space.
     * @returns A promise which resolves to a list of resources that matched the search.
     * @memberof ResourceSystem
     */
    public async searchSharedResources(search: string) {
        const tags = search.toLowerCase().split(/\s+/);
        return await this._resourceCollection.getMany({
            shared: true,
            tags: {
                $in: tags
            }
        });
    }
    /**
     * Clone a resource to a player's resource listing.
     *
     * @param {string} resourceID The ID of the resource to clone.
     * @param {string} user The username of the player whose listing the resource should be cloned to.
     * @memberof ResourceSystem
     */
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
                },
                undefined,
                undefined,
                undefined,
                resourceData.type
            );
        }
    }
    /**
     * Add a list of scripts as resources.
     *
     * @param {string[]} scriptPaths The paths to the scripts to load as resources.
     * @memberof ResourceSystem
     */
    public async addDefaultCodeResources(scriptPaths: string[]) {
        let i = 0;
        for (const scriptPath of scriptPaths) {
            const nameWithoutPath = path.basename(scriptPath);
            const ext = path.extname(nameWithoutPath);
            const file = await fs.readFile(scriptPath);
            const type = fileType(file);
            const id = "R1" + (i++).toString().padStart(23, "0");
            this._deleteResource(id);
            this.addOrUpdateFile(
                "scriptbox",
                {
                    name: nameWithoutPath.substr(0, nameWithoutPath.length - ext.length),
                    data: file,
                    mimetype: type !== undefined ? type.mime : "text/plain"
                },
                id,
                true,
                true
            );
        }
    }
    /**
     * Update a player's resource listing.
     *
     * @private
     * @param {string} owner The username of the player whose resource listing should be updated.
     * @param {Resource[]} resources The list of resources to update the resource listing to.
     * @memberof ResourceSystem
     */
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
    /**
     * Create a resource.
     *
     * @private
     * @param {string} id The ID of the resource to create.
     * @param {ResourceType} type The type of the resource to create.
     * @param {string} name The name of the resource to create.
     * @param {string} filename The filename of the resource to create.
     * @param {string} creator The creator of the resource to create.
     * @param {string} owner The owner of the resource to create.
     * @param {string} description The description of the resource to create.
     * @param {number} time The time the resource was created at.
     * @param {string} icon An icon for the resource; unused.
     * @param {boolean} shared Whether the resource is shared or not.
     * @returns
     * @memberof ResourceSystem
     */
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
    /**
     * A callback to execute when a resource is deleted.
     *
     * @private
     * @param {Resource} resource The resource to delete.
     * @memberof ResourceSystem
     */
    private async _onResourceDelete(resource: Resource) {
        this._resourceServer.delete(resource);
        await this._deleteResource(resource.id);
    }
    /**
     * Convert a filename to a better looking name.
     *
     * @private
     * @param {string} filename The filename
     * @returns A proper name.
     * @memberof ResourceSystem
     */
    private _filenameToName(filename: string) {
        const ext = path.extname(filename);
        return filename.substr(0, filename.length - ext.length);
    }
    /**
     * Check whether a filename is available, and add a number if it is not available.
     * This will continue until 100000 filenames are attempted.
     *
     * @private
     * @param {string} filename The filename to try and use.
     * @param {Resource[]} files The list of resources to check if the filename is in use already.
     * @returns The filename that was free.
     * @memberof ResourceSystem
     */
    private _getAvailableFilename(filename: string, files: Resource[]) {
        const ext = path.extname(filename);
        const fileWithoutExt = filename.substr(0, filename.length - ext.length);
        let tryFilename = fileWithoutExt + ext;
        let num = 1;
        const set = new Set(files.map((file) => file.filename));
        while (set.has(tryFilename)) {
            tryFilename = fileWithoutExt + "." + (num++) + ext;
            if (num > 100000) {
                throw new Error("Maximum filename renumbering attempts exceeded");
            }
        }
        return tryFilename;
    }
    /**
     * Get all of the resources that exist in the database.
     *
     * @private
     * @returns {Promise<TaggedResource[]>} The full list of resource.
     * @memberof ResourceSystem
     */
    private async _getResources(): Promise<TaggedResource[]> {
        return await this._resourceCollection.getMany({});
    }
    /**
     * Set a database entry for a resource.
     *
     * @private
     * @param {Resource} resourceData
     * @memberof ResourceSystem
     */
    private async _setResource(resourceData: Resource) {
        await this._resourceCollection.insert(this._tagifyResource(resourceData));
    }
    /**
     * Update a database entry for a resource.
     *
     * @private
     * @param {Resource} resourceData
     * @memberof ResourceSystem
     */
    private async _updateResource(resourceData: Resource) {
        await this._resourceCollection.update(resourceData.id, this._tagifyResource(resourceData));
    }
    /**
     * Delete the database entry for a resource.
     *
     * @private
     * @param {string} id
     * @memberof ResourceSystem
     */
    private async _deleteResource(id: string) {
        await this._resourceCollection.delete(id);
    }
    /**
     * Make tags from a resource's information and add them to the resource.
     *
     * @private
     * @param {Resource} resourceData The resource to make tags for.
     * @returns The tagged version of the resource.
     * @memberof ResourceSystem
     */
    private _tagifyResource(resourceData: Resource) {
        const tagged = Object.assign({}, resourceData) as TaggedResource;
        tagged.tags = Array.from(new Set([
            ...resourceData.name.toLowerCase().split(/\s+/),
            ...resourceData.description.toLowerCase().split(/\s+/)
        ]).values());
        return tagged;
    }
    /**
     * Get files recursively from a directory.
     *
     * @private
     * @param {string} dir The directory to get files from.
     * @returns An array of file paths.
     * @memberof ResourceSystem
     */
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
