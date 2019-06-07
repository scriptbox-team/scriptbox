/* tslint:disable */
import "module-alias/register";
import EntityManager from "core/entities/entity-manager";
/* tslint:enable */

// Test whether we can create an entity
test("EntityManager::createEntity\tBase Case", () => {
    const em = new EntityManager();
    const ent = em.createEntity();
    expect(ent).not.toBe(undefined);
    expect(ent.exists).toBe(true);
});
