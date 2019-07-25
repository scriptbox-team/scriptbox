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
