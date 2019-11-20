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

export default class ResourceSystemNetworker extends Networker {
    private _resourceSystem: ResourceSystem;
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
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.clientConnectionDelegate);
        netEventHandler.addTokenRequestDelegate(this.addTokenRequestDelegate);
        netEventHandler.addModifyMetadataDelegate(this.modifyMetadataDelegate);
        netEventHandler.addCloneResourceDelegates(this.cloneResourceDelegate);
        netEventHandler.addSearchResourceRepoDelegates(this.searchResourceRepoDelegate);
        netEventHandler.addRequestEditScriptDelegates(this.requestScriptEditDelegate);
        netEventHandler.addEditScriptDelegates(this.editScriptDelegate);
    }
    public clientConnectionDelegate(packet: ClientConnectionPacket, player: Client) {
        this._resourceSystem.sendPlayerListingUpdates(player.username);
    }
    public addTokenRequestDelegate(packet: ClientTokenRequestPacket, player: Client) {
        const token = this._resourceSystem.makePlayerToken(player);
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.Token, new ServerTokenPacket(packet.tokenType, token)),
                new Group(GroupType.Only, [player!])
            )
        );
    }
    public cloneResourceDelegate(packet: ClientCloneResourcePacket, player: Client) {
        this._resourceSystem.cloneResource(packet.resourceID, player.username);
    }

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

    public onPlayerListing(player: Client, resources: Resource[]) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.ResourceListing, new ServerResourceListingPacket(resources)),
                new Group(GroupType.Only, [player])
            )
        );
    }
}
