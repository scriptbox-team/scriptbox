import Client from "core/client";

describe("Client", () => {
    test("can be created", () => {
        const client = new Client("P1234567890123456789012", 2, "testclient", "Test Client");
        expect(client.id).toEqual("P1234567890123456789012");
        expect(client.netClientID).toEqual(2);
        expect(client.username).toEqual("testclient");
        expect(client.displayName).toEqual("Test Client");
    });
});
