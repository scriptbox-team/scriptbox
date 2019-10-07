import Player from "core/player";
import _PlayerManagerInterface from "core/player-manager-interface";
import ClientNetEvent, { ClientEventType } from "networking/client-net-event";
import NetEventHandler from "networking/net-event-handler";
import ClientAddComponentPacket from "networking/packets/client-add-component-packet";
import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientEditComponentPacket from "networking/packets/client-edit-component-packet";
import ClientExecuteScriptPacket from "networking/packets/client-execute-script-packet";
import ClientKeybindsPacket from "networking/packets/client-keybinds-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import ClientModifyMetadataPacket from "networking/packets/client-modify-metadata-packet";
import ClientObjectCreationPacket from "networking/packets/client-object-creation-packet";
import ClientObjectDeletionPacket from "networking/packets/client-object-deletion-packet";
import ClientRemoveComponentPacket from "networking/packets/client-remove-component-packet";
import ClientTokenRequestPacket from "networking/packets/client-token-request-packet";
import { TokenType } from "networking/packets/server-token-packet";
import _PlayerNetworkManager from "networking/player-network-manager";

jest.mock("networking/player-network-manager");
// tslint:disable-next-line: variable-name
const PlayerNetworkManager = _PlayerNetworkManager as jest.Mock<_PlayerNetworkManager>;
// tslint:disable-next-line: variable-name
const PlayerManagerInterface = _PlayerManagerInterface as jest.Mock<_PlayerManagerInterface>;

let netEventHandler!: NetEventHandler;
const mockNetworkManager = new PlayerNetworkManager();

beforeEach(() => {
    netEventHandler = new NetEventHandler(mockNetworkManager);
    netEventHandler.playerCreate = jest.fn(() => {
        return new Player(3, new PlayerManagerInterface());
    });
    netEventHandler.playerRemove = jest.fn();
    PlayerNetworkManager.mock.instances[0].getPlayerFromConnectionID = (id) => {
        return new Player([3, 1, 2][id], new PlayerManagerInterface());
    };
});

describe("NetEventHandler", () => {
    test("handles connection packets", () => {
        const packet = new ClientConnectionPacket(0, "192.168.0.1");
        const fn = jest.fn();
        netEventHandler.addConnectionDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.Connection, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles disconnection packets", () => {
        const packet = new ClientDisconnectPacket(1001);
        const fn = jest.fn();
        netEventHandler.addDisconnectionDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.Disconnect, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles input packets", () => {
        const packet = new ClientKeyboardInputPacket(20, 0, 0);
        const fn = jest.fn();
        netEventHandler.addInputDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.Input, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles chat message packets", () => {
        const packet = new ClientChatMessagePacket("test");
        const fn = jest.fn();
        netEventHandler.addChatMessageDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.ChatMessage, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles object creation packets", () => {
        const packet = new ClientObjectCreationPacket("myPrefab", 10, 20);
        const fn = jest.fn();
        netEventHandler.addObjectCreationDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.ObjectCreation, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles object deletion packets", () => {
        const packet = new ClientObjectDeletionPacket(125);
        const fn = jest.fn();
        netEventHandler.addObjectDeletionDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.ObjectDeletion, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles token request packets", () => {
        const packet = new ClientTokenRequestPacket(TokenType.FileUpload);
        const fn = jest.fn();
        netEventHandler.addTokenRequestDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.TokenRequest, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles metadata modification packets", () => {
        const packet = new ClientModifyMetadataPacket("testResource", "description", "a good resource");
        const fn = jest.fn();
        netEventHandler.addModifyMetadataDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.ModifyMetadata, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles component addition packets", () => {
        const packet = new ClientAddComponentPacket("testClass", "testComponent");
        const fn = jest.fn();
        netEventHandler.addAddComponentDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.AddComponent, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles component removal packets", () => {
        const packet = new ClientRemoveComponentPacket(123);
        const fn = jest.fn();
        netEventHandler.addRemoveComponentDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.RemoveComponent, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles component editing packets", () => {
        const packet = new ClientEditComponentPacket("testComponent", "someProp", "25", "number");
        const fn = jest.fn();
        netEventHandler.addEditComponentDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.EditComponent, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles script execution packets", () => {
        const packet = new ClientExecuteScriptPacket("testScript", "arg1 arg2");
        const fn = jest.fn();
        netEventHandler.addExecuteScriptDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.ExecuteScript, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
    test("handles keybinding packets", () => {
        const packet = new ClientKeybindsPacket({12: "jump", 522: "fire laser"}, "242");
        const fn = jest.fn();
        netEventHandler.addKeybindingDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.Keybinds, packet.serialize()));
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Player(3, new PlayerManagerInterface()));
    });
});
