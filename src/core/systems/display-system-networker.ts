import Client from "core/client";
import Group, { GroupType } from "core/group";
import NetEventHandler from "networking/net-event-handler";
import Networker from "networking/networker";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ServerCameraUpdatePacket from "networking/packets/server-camera-update-packet";
import ServerDisplayPacket from "networking/packets/server-display-packet";
import ServerEntityInspectionListingPacket from "networking/packets/server-entity-inspection-listing-packet";
import ServerSoundPacket from "networking/packets/server-sound-packet";
import ServerMessage from "networking/server-messages/server-message";
import ServerNetEvent, { ServerEventType } from "networking/server-net-event";
import AudioObject from "resource-management/audio-object";
import ComponentInfo from "resource-management/component-info";
import RenderObject from "resource-management/render-object";

import DisplaySystem from "./display-system";

/**
 * Interfaces between DisplaySystem and the networking components of the program.
 * This takes incoming packets and calls the associated functions in the system, and receives
 * callbacks from DisplaySystem to send outgoing packets.
 *
 * @export
 * @class DisplaySystemNetworker
 * @extends {Networker}
 * @module core
 */
export default class DisplaySystemNetworker extends Networker {
    private _displaySystem: DisplaySystem;
    /**
     * Instantiates the networker.
     * This configures it with the DisplaySystem it's interfacing with
     * @param {DisplaySystem} displaySystem The DisplaySystem to configure with
     * @memberof DisplaySystemNetworker
     */
    constructor(displaySystem: DisplaySystem) {
        super();
        this.connectionDelegate = this.connectionDelegate.bind(this);

        this.onRenderObjectDisplay = this.onRenderObjectDisplay.bind(this);
        this.onEntityInspectionListing = this.onEntityInspectionListing.bind(this);
        this.onCameraData = this.onCameraData.bind(this);
        this.onSoundData = this.onSoundData.bind(this);

        this._displaySystem = displaySystem;
        this._displaySystem.onRenderObjectDisplay(this.onRenderObjectDisplay);
        this._displaySystem.onSoundData(this.onSoundData);
        this._displaySystem.onEntityInspection(this.onEntityInspectionListing);
        this._displaySystem.onCameraData(this.onCameraData);
    }
    /**
     * Adds input delegates to a NetEventHandler
     * @param {NetEventHandler} netEventHandler the NetEventHandler to add the delegates to.
     * @memberof DisplaySystemNetworker
     */
    public hookupInput(netEventHandler: NetEventHandler) {
        netEventHandler.addConnectionDelegate(this.connectionDelegate);
    }
    /**
     * A delegate which tells the DisplaySystem to send a full display when a connection packet is received.
     * @param {ClientConnectionPacket} packet The connection packet
     * @param {Client} player The client of the connection packet
     * @memberof DisplaySystemNetworker
     */
    public connectionDelegate(packet: ClientConnectionPacket, player: Client) {
        this._displaySystem.sendFullDisplayToPlayer(player);
    }
    /**
     * A callback that is executed when the DisplaySystem wants to send RenderObjects to a client group.
     * @param {RenderObject[]} renderObjects The render objects to send
     * @param {Group<Client>} playerGroup The player group to send the render objects to
     * @memberof DisplaySystemNetworker
     */
    public onRenderObjectDisplay(renderObjects: RenderObject[], playerGroup: Group<Client>) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.DisplayPackage, new ServerDisplayPacket(renderObjects)),
                playerGroup
            )
        );
    }
    /**
     * A callback that is executed when the DisplaySystem wants to send AudioObjects to a client group.
     * @param {AudioObject[]} audioObjects The audio objects to send
     * @param {Group<Client>} playerGroup The player group to send the audio objects to.
     * @memberof DisplaySystemNetworker
     */
    public onSoundData(audioObjects: AudioObject[], playerGroup: Group<Client>) {
        this.send(
            new ServerMessage(
                new ServerNetEvent(ServerEventType.SoundPlay, new ServerSoundPacket(audioObjects)),
                playerGroup
            )
        );
    }
    /**
     * A callback that is executed when the DisplaySystem wants to send entity inspection information to a client group.
     * @param {string} entityID The ID of the entity being inspected
     * @param {ComponentInfo[]} components The component information of the inspected entity
     * @param {boolean} controlledByPlayer Whether the component is controlled by the inspecting player or not
     * @param {Group<Client>} playerGroup The client group that is inspecting the client.
     * @memberof DisplaySystemNetworker
     */
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
    /**
     * A callback that is executed when the DisplaySystem wants to send camera information to a client
     * @param {Client} client The client to send the camera information to
     * @param {{x: number, y: number, scale: number}} cameraData The camera data to send to the client
     * @memberof DisplaySystemNetworker
     */
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
