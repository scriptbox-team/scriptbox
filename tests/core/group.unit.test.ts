import Group, { GroupType } from "core/group";

describe("Group", () => {
    test(("can be created"), () => {
        const numberGroup = new Group<number>(GroupType.All, [1, 2, 4, 7]);
        expect(numberGroup.list).toEqual([1, 2, 4, 7]);
        expect(numberGroup.groupType).toEqual(GroupType.All);
    });
});
