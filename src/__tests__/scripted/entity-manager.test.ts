/* tslint:disable */
import "../fix-test-paths";
import EntityManager from "__scripted__/entity-manager";
/* tslint:enable */

// Test whether we can create an entity
test("EntityManager::createEntity\tBase Case", () => {
    const em = new EntityManager();
    const ent = em.createEntity();
    expect(ent).not.toBe(undefined);
    expect(ent.exists).toBe(true);
});
