/**
 * A data type representing an array of changes of a generic object type.
 * This indexes the contained objects using an ID as a map in order to clearly
 * indicate which object is being added, updated, or removed.
 * @module core
 */
export default class Difference<T> {
    public added: {[id: string]: T};
    public updated: {[id: string]: T};
    public removed: {[id: string]: T};
    constructor() {
        this.added = {};
        this.updated = {};
        this.removed = {};
    }
}
