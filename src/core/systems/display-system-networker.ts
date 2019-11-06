import Client from "core/client";
import Group, { GroupType } from "core/group";
import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ServerCameraUpdatePacket from "networking/packets/server-camera-update-packet";
import ServerDisplayPacket from "networking/packets/server-display-packet";
import ServerEntityInspectionListingPacket from "networking/packets/server-entity-inspection-listing-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";
import ComponentInfo from "resource-management/component-info";
import RenderObject from "resource-management/render-object";

import DisplaySystem from "./display-system";

export default class DisplaySystemNetworker extends Networker {
    private _displaySystem: DisplaySystem;
    constructor(displaySystem: DisplaySystem) {
        super();
        this.connectionDelegate = this.connectionDelegate.bind(this);

        this.onRenderObjectDisplay = this.onRenderObjectDisplay.bind(this);
        this.onEntityInspectionListing = this.onEntityInspectionListing.bind(this);
        this.onCameraData = this.onCameraData.bind(this);

        this._displaySystem = displaySystem;
        this._displaySystem.onRenderObjectDisplay(this.onRenderObjectDisplay);
        this._displaySystem.onEntityInspection(this.onEntityInspectionListing);
        this._displaySystem.onCameraData(this.onCameraData);
    }
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.connectionDelegate);
    }
    public connectionDelegate(packet: ClientConnectionPacket, player: Client) {
        this._displaySystem.sendFullDisplayToPlayer(player);
    }
    public onRenderObjectDisplay(renderObjects: RenderObject[], playerGroup: Group<Client>) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.DisplayPackage, new ServerDisplayPacket(renderObjects)),
                playerGroup
            )
        );
    }
    public onEntityInspectionListing(
            entityID: string,
            components: ComponentInfo[],
            controlledByPlayer: boolean,
            playerGroup: Group<Client>) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.EntityInspectListing, new ServerEntityInspectionListingPacket(
                    components,
                    entityID,
                    controlledByPlayer
                )),
                playerGroup
            )
        );
    }
    public onCameraData(client: Client, cameraData: {x: number, y: number, scale: number}) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.CameraInfo, new ServerCameraUpdatePacket(
                    cameraData.x,
                    cameraData.y,
                    cameraData.scale
                )),
                new Group<Client>(GroupType.Only, [client])
            )
        );
    }
}
