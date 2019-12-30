import Client from "core/client";
import Group, { GroupType } from "core/group";
import DisplaySystem from "core/systems/display-system";
import ComponentInfo from "resource-management/component-info";
import ComponentOption, { ComponentOptionType } from "resource-management/component-option";
import RenderObject from "resource-management/render-object";

const display = {
    entities: {
        E123456789012345678901234: {
            position: {x: 0, y: 0},
            collisionBox: {
                x1: 0,
                y1: 0,
                x2: 32,
                y2: 32
            }
        },
        E098765432109876543210987: {
            position: {x: 10, y: 12},
            collisionBox: {
                x1: 5,
                y1: 5,
                x2: 27,
                y2: 27
            }
        },
        E234567890123456789012345: {
            position: {x: -10, y: -11},
            collisionBox: {
                x1: 15,
                y1: 0,
                x2: 17,
                y2: 40
            }
        }
    },
    sprites: {
        C123456789012345678901234: {
            ownerID: "E123456789012345678901234",
            texture: "R000000000000000000000000",
            textureSubregion: {
                x: 0,
                y: 0,
                width: 32,
                height: 32
            },
            position: {x: 0, y: 0},
            scale: {x: 1, y: 1},
            depth: 1

        },
        C098765432109876543210987: {
            ownerID: "E098765432109876543210987",
            texture: "R000000000000000000000000",
            textureSubregion: {
                x: 32,
                y: 0,
                width: 32,
                height: 32
            },
            position: {x: 10, y: 12},
            scale: {x: 1, y: 1},
            depth: 0
        },
        C234567890123456789012345: {
            ownerID: "E234567890123456789012345",
            texture: "R000000000000000000000001",
            textureSubregion: {
                x: 0,
                y: 0,
                width: 32,
                height: 32
            },
            position: {x: -10, y: -11},
            scale: {x: 1, y: 1},
            depth: -1
        }
    },
    inspectedEntityInfo: {
        P1234567890123456789012: {
            id: "E234567890123456789012345",
            name: "Entity E234567890123456789012345",
            componentInfo: {
                component1: {
                    id: "C123456789012345678901235",
                    name: "component1",
                    enabled: true,
                    attributes: [
                        {name: "val1", kind: "string", value: "pineapple"},
                        {name: "val2", kind: "number", value: "25"}
                    ],
                    lastFrameTime: 1,
                },
                component2: {
                    id: "C123456789012345678901236",
                    name: "component2",
                    enabled: true,
                    attributes: [
                        {name: "aValue", kind: "string", value: "apple"},
                        {name: "anotherValue", kind: "string", value: "good"}
                    ],
                    lastFrameTime: 0
                }
            }
        }
    },
    messages: [],
    players: {
        P1234567890123456789012: {
            client: new Client("P123456789012345678901234", 1, "testPlayer", "test player"),
            camera: {x: 0, y: 0, scale: 2}
        },
        P1234567890123456789013: {
            client: new Client("P123456789012345678901235", 2, "testPlayer2", "test player 2"),
            camera: {x: 10, y: 12, scale: 1}
        }
    },
    sounds: {
        C133456789012345678901234: {
            position: {
                x: 30,
                y: 30
            },
            resource: "R000000000000000000000004",
            volume: 1
        }
    }
};

let displaySystem!: DisplaySystem;

describe("DisplaySystem", () => {
    beforeEach(() => {
        displaySystem = new DisplaySystem();
    });
    test("Can broadcast display differences", () => {
        const renderObjectDisplayFn = jest.fn();
        displaySystem.onRenderObjectDisplay(renderObjectDisplayFn);
        displaySystem.broadcastDisplay(display);
        expect(renderObjectDisplayFn).toBeCalledTimes(1);
        expect(renderObjectDisplayFn.mock.calls[0][0]).toEqual([
            new RenderObject(
                "E123456789012345678901234",
                "C123456789012345678901234",
                "R000000000000000000000000",
                {
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                },
                {x: 0, y: 0},
                {x: 1, y: 1},
                1,
                false
            ),
            new RenderObject(
                "E098765432109876543210987",
                "C098765432109876543210987",
                "R000000000000000000000000",
                {
                    x: 32,
                    y: 0,
                    width: 32,
                    height: 32
                },
                {x: 10, y: 12},
                {x: 1, y: 1},
                0,
                false
            ),
            new RenderObject(
                "E234567890123456789012345",
                "C234567890123456789012345",
                "R000000000000000000000001",
                {
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                },
                {x: -10, y: -11},
                {x: 1, y: 1},
                -1,
                false
            )
        ]);
        expect(renderObjectDisplayFn.mock.calls[0][1]).toEqual(
            new Group(GroupType.All, [])
        );

        // Test the "differences" part now too
        const changedDisplay = {
            entities: Object.assign({}, display.entities),
            sprites: Object.assign({}, display.sprites),
            inspectedEntityInfo: Object.assign({}, display.inspectedEntityInfo),
            messages: Object.assign({}, display.messages),
            players: Object.assign({}, display.players),
            sounds: Object.assign({}, display.sounds)
        };
        changedDisplay.sprites.C123456789012345678901234
            = Object.assign({}, changedDisplay.sprites.C123456789012345678901234);
        changedDisplay.sprites.C123456789012345678901234.position = {x: 5, y: 2};
        delete changedDisplay.sprites.C234567890123456789012345;

        displaySystem.broadcastDisplay(changedDisplay);

        expect(renderObjectDisplayFn).toBeCalledTimes(2);
        expect(renderObjectDisplayFn.mock.calls[1][0]).toEqual([
            new RenderObject(
                "E123456789012345678901234",
                "C123456789012345678901234",
                "R000000000000000000000000",
                {
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                },
                {x: 5, y: 2},
                {x: 1, y: 1},
                1,
                false
            ),
            new RenderObject(
                "E234567890123456789012345",
                "C234567890123456789012345",
                "R000000000000000000000001",
                {
                    x: 0,
                    y: 0,
                    width: 32,
                    height: 32
                },
                {x: -10, y: -11},
                {x: 1, y: 1},
                -1,
                true
            )
        ]);
        expect(renderObjectDisplayFn.mock.calls[1][1]).toEqual(
            new Group(GroupType.All, [])
        );
    });
    test("can send camera data", () => {
        const cameraDataFn = jest.fn();
        displaySystem.onCameraData(cameraDataFn);

        displaySystem.sendCameraData(display);

        expect(cameraDataFn).toBeCalledTimes(2);
        expect(cameraDataFn.mock.calls[0][0]).toEqual(display.players.P1234567890123456789012.client);
        expect(cameraDataFn.mock.calls[0][1]).toEqual(display.players.P1234567890123456789012.camera);
        expect(cameraDataFn.mock.calls[1][0]).toEqual(display.players.P1234567890123456789013.client);
        expect(cameraDataFn.mock.calls[1][1]).toEqual(display.players.P1234567890123456789013.camera);
    });
    test("can send sound data", () => {
        const soundDataFn = jest.fn();
        displaySystem.onSoundData(soundDataFn);

        displaySystem.sendSoundData(display);

        expect(soundDataFn).toBeCalledTimes(2);
        expect(Array.isArray(soundDataFn.mock.calls[0][0])).toBeTruthy();

        // Avoiding the actual volume since that may be tweaked and checking it isn't really necessary for this test
        expect(soundDataFn.mock.calls[0][0][0].id).toEqual("C133456789012345678901234");
        expect(soundDataFn.mock.calls[0][0][0].resource).toEqual("R000000000000000000000004");
        expect(soundDataFn.mock.calls[0][1]).toEqual(
            new Group(GroupType.Only, [display.players.P1234567890123456789012.client])
        );
        expect(soundDataFn.mock.calls[1][0][0].id).toEqual("C133456789012345678901234");
        expect(soundDataFn.mock.calls[1][0][0].resource).toEqual("R000000000000000000000004");
        expect(soundDataFn.mock.calls[1][1]).toEqual(
            new Group(GroupType.Only, [display.players.P1234567890123456789013.client])
        );
    });
    test("can send inspection data", () => {
        const entityInspectionFn = jest.fn();
        displaySystem.onEntityInspection(entityInspectionFn);

        displaySystem.sendInspectedEntities(display);
        expect(entityInspectionFn).toBeCalledTimes(1);
        expect(entityInspectionFn.mock.calls[0][0]).toEqual("E234567890123456789012345");
        expect(entityInspectionFn.mock.calls[0][1]).toEqual([
            new ComponentInfo(
                "C123456789012345678901235",
                "component1",
                "",
                0,
                "",
                true,
                [
                    new ComponentOption("val1", "val1", ComponentOptionType.String, "pineapple", true),
                    new ComponentOption("val2", "val2", ComponentOptionType.Number, "25", true)
                ]
            ),
            new ComponentInfo(
                "C123456789012345678901236",
                "component2",
                "",
                0,
                "",
                true,
                [
                    new ComponentOption("aValue", "aValue", ComponentOptionType.String, "apple", true),
                    new ComponentOption("anotherValue", "anotherValue", ComponentOptionType.String, "good", true)
                ]
            )
        ]);
        expect(entityInspectionFn.mock.calls[0][2]).toEqual(false);
        expect(entityInspectionFn.mock.calls[0][3]).toEqual(
            new Group(GroupType.Only, [display.players.P1234567890123456789012.client])
        );
    });
});
