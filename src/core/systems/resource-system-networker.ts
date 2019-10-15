import Client from "core/client";
import Group, { GroupType } from "core/group";
import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientModifyMetadataPacket from "networking/packets/client-modify-metadata-packet";
import ClientTokenRequestPacket from "networking/packets/client-token-request-packet";
import ServerResourceListingPacket from "networking/packets/server-resource-listing-packet";
import ServerTokenPacket from "networking/packets/server-token-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";
import Resource from "resource-management/resource";

import ResourceSystem from "./resource-system";

export default class ResourceSystemNetworker extends Networker {
    private _resourceSystem: ResourceSystem;
    constructor(resourceSystem: ResourceSystem) {
        super();
        this.addTokenRequestDelegate = this.addTokenRequestDelegate.bind(this);
        this.modifyMetadataDelegate = this.modifyMetadataDelegate.bind(this);

        this.onPlayerListing = this.onPlayerListing.bind(this);

        this._resourceSystem = resourceSystem;
        this._resourceSystem.onPlayerListingUpdate = this.onPlayerListing;
    }
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addTokenRequestDelegate(this.addTokenRequestDelegate);
        netEventHandler.addModifyMetadataDelegate(this.modifyMetadataDelegate);
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
