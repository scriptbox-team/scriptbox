import EntityManager from "scripts/entity-manager";

// Test whether we can create an entity
test("EntityManager::createEntity\t\tBase Case", () => {
    const em = new EntityManager();
    const ent = em.createEntity();
    expect(ent).not.toBe(undefined);
    expect(ent.exists).toBe(true);
});
