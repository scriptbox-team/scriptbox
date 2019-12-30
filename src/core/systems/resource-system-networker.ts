import Client from "core/client";
import Group, { GroupType } from "core/group";
import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientCloneResourcePacket from "networking/packets/client-clone-resource-packet";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientEditScriptPacket from "networking/packets/client-edit-script-packet";
import ClientModifyMetadataPacket from "networking/packets/client-modify-metadata-packet";
import ClientRequestEditScriptPacket from "networking/packets/client-request-edit-script-packet";
import ClientSearchResourceRepoPacket from "networking/packets/client-search-resource-repo-packet";
import ClientTokenRequestPacket from "networking/packets/client-token-request-packet";
import ServerResourceListingPacket from "networking/packets/server-resource-listing-packet";
import ServerResourceRepoListPacket from "networking/packets/server-resource-repo-list-packet";
import ServerScriptTextPacket from "networking/packets/server-script-text-packet";
import ServerTokenPacket from "networking/packets/server-token-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";
import Resource, { ResourceType } from "resource-management/resource";

import ResourceSystem from "./resource-system";

/**
 * Interfaces between ResourceSystem and the networking components of the program.
 * This takes incoming packets and calls the associated functions in the system, and receives
 * callbacks from ResourceSystem to send outgoing packets.
 *
 * @export
 * @class ResourceSystemNetworker
 * @extends {Networker}
 * @module core
 */
export default class ResourceSystemNetworker extends Networker {
    private _resourceSystem: ResourceSystem;
    /**
     * Instantiates the networker.
     * This configures it with the ResourceSystem it's interfacing with
     * @param {ResourceSystem} resourceSystem The ResourceSystem to configure with
     * @memberof ResourceSystemNetworker
     */
    constructor(resourceSystem: ResourceSystem) {
        super();
        this.clientConnectionDelegate = this.clientConnectionDelegate.bind(this);
        this.addTokenRequestDelegate = this.addTokenRequestDelegate.bind(this);
        this.modifyMetadataDelegate = this.modifyMetadataDelegate.bind(this);
        this.cloneResourceDelegate = this.cloneResourceDelegate.bind(this);
        this.searchResourceRepoDelegate = this.searchResourceRepoDelegate.bind(this);
        this.requestScriptEditDelegate = this.requestScriptEditDelegate.bind(this);
        this.editScriptDelegate = this.editScriptDelegate.bind(this);

        this.onPlayerListing = this.onPlayerListing.bind(this);

        this._resourceSystem = resourceSystem;
        this._resourceSystem.addPlayerListingDelegate(this.onPlayerListing);
    }
    /**
     * Adds input delegates to a NetEventHandler
     * @param {NetEventHandler} netEventHandler the NetEventHandler to add the delegates to.
     * @memberof ResourceSystemNetworker
     */
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.clientConnectionDelegate);
        netEventHandler.addTokenRequestDelegate(this.addTokenRequestDelegate);
        netEventHandler.addModifyMetadataDelegate(this.modifyMetadataDelegate);
        netEventHandler.addCloneResourceDelegates(this.cloneResourceDelegate);
        netEventHandler.addSearchResourceRepoDelegates(this.searchResourceRepoDelegate);
        netEventHandler.addRequestEditScriptDelegates(this.requestScriptEditDelegate);
        netEventHandler.addEditScriptDelegates(this.editScriptDelegate);
    }
    /**
     * A delegate which tells the ResourceSystem to send a player's resource listing when
     * a connection packet is received.
     *
     * @param {ClientConnectionPacket} packet The connection packet.
     * @param {Client} player The client of the connection packet.
     * @memberof ResourceSystemNetworker
     */
    public clientConnectionDelegate(packet: ClientConnectionPacket, player: Client) {
        this._resourceSystem.sendPlayerListingUpdates(player.username);
    }
    /**
     * A delegate which passes a token request to the ResourceSystem
     *
     * @param {ClientTokenRequestPacket} packet The token request packet
     * @param {Client} player The client of the token request packet
     * @memberof ResourceSystemNetworker
     */
    public addTokenRequestDelegate(packet: ClientTokenRequestPacket, player: Client) {
        const token = this._resourceSystem.makePlayerToken(player);
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.Token, new ServerTokenPacket(packet.tokenType, token)),
                new Group(GroupType.Only, [player!])
            )
        );
    }
    /**
     * A delegate which passes a resource cloning request to the ResourceSystem
     *
     * @param {ClientCloneResourcePacket} packet The resource cloning request packet
     * @param {Client} player The client of the resource cloning request packet
     * @memberof ResourceSystemNetworker
     */
    public cloneResourceDelegate(packet: ClientCloneResourcePacket, player: Client) {
        this._resourceSystem.cloneResource(packet.resourceID, player.username);
    }

    /**
     * A delegate which passes a shared resource search to the ResourceSystem
     *
     * @param {ClientSearchResourceRepoPacket} packet The shared resource search packet
     * @param {Client} player The client of the shared resource search packet
     * @memberof ResourceSystemNetworker
     */
    public async searchResourceRepoDelegate(packet: ClientSearchResourceRepoPacket, player: Client) {
        const results = await this._resourceSystem.searchSharedResources(packet.search);
        this.send(
            new ServerMessage(
                new ServerNetEvent(
                    ServerEventType.ResourceRepoList,
                    new ServerResourceRepoListPacket(packet.search, results)),
                new Group(GroupType.Only, [player])
            )
        );
    }
    /**
     * A delegate which passes a script resource edit request to the ResourceSystem.
     *
     * @param {ClientRequestEditScriptPacket} packet The script resource edit request packet.
     * @param {Client} player The client of the script resource edit request packet.
     * @memberof ResourceSystemNetworker
     */
    public async requestScriptEditDelegate(packet: ClientRequestEditScriptPacket, player: Client) {
        const script = await this._resourceSystem.playerRequestResource(packet.scriptID, player);
        if (script !== undefined) {
            this.send(
                new ServerMessage(
                    new ServerNetEvent(ServerEventType.ScriptText, new ServerScriptTextPacket(packet.scriptID, script)),
                    new Group(GroupType.Only, [player])
                )
            );
        }
    }

    /**
     * A delegate which passes a script resource edit to the ResourceSystem.
     *
     * @param {ClientEditScriptPacket} packet The script resource edit packet.
     * @param {Client} player The client of the script resource edit packet.
     * @memberof ResourceSystemNetworker
     */
    public async editScriptDelegate(packet: ClientEditScriptPacket, player: Client) {
        const info = await this._resourceSystem.getResourceByID(packet.scriptID);
        if (info === undefined) {
            return;
        }
        this._resourceSystem.updateResource(
            player.username,
            ResourceType.Script,
            packet.scriptID,
            {
                name: info.filename,
                data: Buffer.from(packet.script, "utf8"),
                mimetype: "text/plain"
            }
        );
    }

    /**
     * A delegate which passes a resource metadata edit to the ResourceSystem.
     *
     * @param {ClientModifyMetadataPacket} packet The resource metadata edit packet.
     * @param {Client} player The client of teh resource metadata edit packet.
     * @memberof ResourceSystemNetworker
     */
    public modifyMetadataDelegate(packet: ClientModifyMetadataPacket, player: Client) {
        try {
            this._resourceSystem.updateResourceData(
                player.username,
                packet.resourceID,
                packet.property,
                packet.value
            );
        }
        catch (err) {
            console.log(err);
        }
    }

    /**
     * A callback that is executed when the ResourceSystem has a resource listing to send.
     *
     * @param {Client} player The client to send the resource listing to.
     * @param {Resource[]} resources The resource list to send.
     * @memberof ResourceSystemNetworker
     */
    public onPlayerListing(player: Client, resources: Resource[]) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.ResourceListing, new ServerResourceListingPacket(resources)),
                new Group(GroupType.Only, [player])
            )
        );
    }
}
