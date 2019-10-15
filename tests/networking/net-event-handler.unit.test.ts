import Client from "core/client";
import ClientNetEvent, { ClientEventType } from "networking/client-net-event";
import NetEventHandler from "networking/net-event-handler";
import ClientAddComponentPacket from "networking/packets/client-add-component-packet";
import ClientChatMessagePacket from "networking/packets/client-chat-message-packet";
import ClientConnectionPacket from "networking/packets/client-connection-packet";
import ClientDisconnectPacket from "networking/packets/client-disconnect-packet";
import ClientEditComponentPacket from "networking/packets/client-edit-component-packet";
import ClientEntityCreationPacket from "networking/packets/client-entity-creation-packet";
import ClientEntityDeletionPacket from "networking/packets/client-entity-deletion-packet";
import ClientExecuteScriptPacket from "networking/packets/client-execute-script-packet";
import ClientKeybindsPacket from "networking/packets/client-keybinds-packet";
import ClientKeyboardInputPacket from "networking/packets/client-keyboard-input-packet";
import ClientModifyMetadataPacket from "networking/packets/client-modify-metadata-packet";
import ClientRemoveComponentPacket from "networking/packets/client-remove-component-packet";
import ClientTokenRequestPacket from "networking/packets/client-token-request-packet";
import { TokenType } from "networking/packets/server-token-packet";

let netEventHandler!: NetEventHandler;

beforeEach(() => {
    netEventHandler = new NetEventHandler();
    netEventHandler.playerCreate = jest.fn((connID, packet) => {
        return new Client("testPlayerID", connID, "testPlayer", "Test Player");
    });
    netEventHandler.playerRemove = jest.fn();
    (netEventHandler as any)._connectionIDToPlayer = new Map<number, Client>([
        [1, new Client("testPlayerID2", 1, "testPlayer2", "Test Player2")]
    ]);
});

describe("NetEventHandler", () => {
    test("handles connection packets", () => {
        const packet = new ClientConnectionPacket(0, "192.168.0.1");
        const fn = jest.fn();
        netEventHandler.addConnectionDelegate(fn);
        netEventHandler.handle(0, new ClientNetEvent(ClientEventType.Connection, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID", 0, "testPlayer", "Test Player"));
    });
    test("handles disconnection packets", () => {
        const packet = new ClientDisconnectPacket(1001);
        const fn = jest.fn();
        netEventHandler.addDisconnectionDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.Disconnect, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles input packets", () => {
        const packet = new ClientKeyboardInputPacket(20, 0, 0);
        const fn = jest.fn();
        netEventHandler.addInputDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.Input, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles chat message packets", () => {
        const packet = new ClientChatMessagePacket("test");
        const fn = jest.fn();
        netEventHandler.addChatMessageDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.ChatMessage, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles object creation packets", () => {
        const packet = new ClientEntityCreationPacket("myPrefab", 10, 20);
        const fn = jest.fn();
        netEventHandler.addEntityCreationDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.EntityCreation, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles object deletion packets", () => {
        const packet = new ClientEntityDeletionPacket("125");
        const fn = jest.fn();
        netEventHandler.addEntityDeletionDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.EntityDeletion, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles token request packets", () => {
        const packet = new ClientTokenRequestPacket(TokenType.FileUpload);
        const fn = jest.fn();
        netEventHandler.addTokenRequestDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.TokenRequest, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles metadata modification packets", () => {
        const packet = new ClientModifyMetadataPacket("testResource", "description", "a good resource");
        const fn = jest.fn();
        netEventHandler.addModifyMetadataDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.ModifyMetadata, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles component addition packets", () => {
        const packet = new ClientAddComponentPacket("testClass", "testComponent");
        const fn = jest.fn();
        netEventHandler.addAddComponentDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.AddComponent, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles component removal packets", () => {
        const packet = new ClientRemoveComponentPacket("123");
        const fn = jest.fn();
        netEventHandler.addRemoveComponentDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.RemoveComponent, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles component editing packets", () => {
        const packet = new ClientEditComponentPacket("testComponent", "someProp", "25", "number");
        const fn = jest.fn();
        netEventHandler.addEditComponentDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.EditComponent, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles script execution packets", () => {
        const packet = new ClientExecuteScriptPacket("testScript", "arg1 arg2");
        const fn = jest.fn();
        netEventHandler.addExecuteScriptDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.ExecuteScript, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
    test("handles keybinding packets", () => {
        const packet = new ClientKeybindsPacket({12: "jump", 522: "fire laser"}, "242");
        const fn = jest.fn();
        netEventHandler.addKeybindingDelegate(fn);
        netEventHandler.handle(1, new ClientNetEvent(ClientEventType.Keybinds, packet.serialize()));
        expect(fn).toBeCalledTimes(1);
        expect(fn.mock.calls[0][0]).toEqual(packet);
        expect(fn.mock.calls[0][1]).toEqual(new Client("testPlayerID2", 1, "testPlayer2", "Test Player2"));
    });
});
