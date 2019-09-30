import ServerEntityInspectionListingPacket from "networking/packets/server-entity-inspection-listing-packet";
import ComponentInfo from "resource-management/component-info";
import ComponentOption, { ComponentOptionType } from "resource-management/component-option";

const serializedPacket = {components: [
    {
        id: 123,
        name: "Test Component",
        creator: "nobody",
        description: "a good component",
        time: 10000,
        icon: "noIcon",
        options: [{
            id: "testVar",
            name: "testVar",
            type: ComponentOptionType.Number,
            baseValue: "12",
            readOnly: true
        },
        {
            id: "testVar2",
            name: "Test Var 2",
            type: ComponentOptionType.String,
            baseValue: "pineapple",
            readOnly: false,
            currentValue: "apple"
        },
        {
            id: "testVar3",
            name: "Test Var 3",
            type: ComponentOptionType.Boolean,
            baseValue: "true",
            readOnly: false,
            currentValue: "false"
        }]
    },
    {
        id: 124,
        name: "Test Component 2",
        creator: "nobody else",
        description: "a gooder component",
        time: 10001,
        icon: "noIcon",
        options: [{
            id: "testVar4",
            name: "testVar4",
            type: ComponentOptionType.Number,
            baseValue: "12",
            readOnly: true
        },
        {
            id: "testVar5",
            name: "Test Var 5",
            type: ComponentOptionType.String,
            baseValue: "pineapple",
            readOnly: false,
            currentValue: "apple"
        },
        {
            id: "testVar6",
            name: "Test Var 6",
            type: ComponentOptionType.Boolean,
            baseValue: "true",
            readOnly: false,
            currentValue: "false"
        }]
    }
], entityID: 123};
const packet = new ServerEntityInspectionListingPacket(
    [
        new ComponentInfo(123, "Test Component", "nobody", "a good component", 10000, "noIcon", [
            new ComponentOption("testVar", "testVar", ComponentOptionType.Number, "12", true),
            new ComponentOption("testVar2", "Test Var 2", ComponentOptionType.String, "pineapple", false, "apple"),
            new ComponentOption("testVar3", "Test Var 3", ComponentOptionType.Boolean, "true", false, "false")
        ]),
        new ComponentInfo(124, "Test Component 2", "nobody else", "a gooder component", 10001, "noIcon", [
            new ComponentOption("testVar4", "testVar4", ComponentOptionType.Number, "12", true),
            new ComponentOption("testVar5", "Test Var 5", ComponentOptionType.String, "pineapple", false, "apple"),
            new ComponentOption("testVar6", "Test Var 6", ComponentOptionType.Boolean, "true", false, "false")
        ])
    ]
    , 123);

test("ServerEntityInspectionListingPacket::Serialization", () => {
    const serializedTest = packet.serialize();
    expect(serializedTest).toEqual(serializedPacket);
});

test("ServerEntityInspectionListingPacket::Deserialization", () => {
    const packetTest = ServerEntityInspectionListingPacket
.deserialize(serializedPacket);
    expect(packetTest).toEqual(packet);
});
