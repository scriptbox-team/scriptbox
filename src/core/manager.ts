/**
 * A map of a particular object with functions passed in to define how an individual entry
 * is created and deleted. This also natively supports delayed entry deletion.
 *
 * @export
 * @class Manager
 * @template T
 * @module core
 */
export default class Manager<T> {
    private _items: Map<string, T>;
    private _deletionQueue: Array<{id: string, args: any[]}>;
    private _createFunc: (id: string, ...args: any[]) => T;
    private _deleteFunc?: (item: T, ...args: any[]) => void;
    /**
     * Creates an instance of Manager.
     * @param {(id: string, ...args: any[]) => T} createFunc The function to call when creating an entry.
     * @param {(item: T, ...args: any[]) => void} [deleteFunc] The function to call when an entry is deleted.
     * @memberof Manager
     */
    constructor(createFunc: (id: string, ...args: any[]) => T, deleteFunc?: (item: T, ...args: any[]) => void) {
        this._items = new Map<string, T>();
        this._createFunc = createFunc;
        this._deleteFunc = deleteFunc;
        this._deletionQueue = [];
    }
    /**
     * Get an entry by its ID.
     *
     * @param {string} id The ID of the entry
     * @returns {(T | undefined)} The entry if it exists, undefined otherwise.
     * @memberof Manager
     */
    public get(id: string): T | undefined {
        return this._items.get(id);
    }
    /**
     * Get all of the entries of the manager.
     *
     * @returns The entries of the manager as an IterableIterator.
     * @memberof Manager
     */
    public entries() {
        return this._items.entries();
    }
    /**
     * Check if the manager has an entry of a particular ID.
     *
     * @param {string} id The ID of the entry to check.
     * @returns True if the manager has an entry for that ID, false otherwise.
     * @memberof Manager
     */
    public has(id: string) {
        return this._items.has(id);
    }
    /**
     * Create an entry in the manager.
     *
     * @param {string} id The ID to use for the entry.
     * @param {...any[]} args Creation arguments for the created entry.
     * @returns The created entry.
     * @memberof Manager
     */
    public create(id: string, ...args: any[]) {
        const item = this._createFunc(id, ...args);
        this._items.set(id, item);
        return item;
    }
    /**
     * Forcibly delete an entry in the manager.
     * This will immediately delete the entry instead of queueing it for deletion.
     *
     * @param {string} id The ID of the entry to delete.
     * @param {...any[]} args Deletion arguments.
     * @memberof Manager
     */
    public forceDelete(id: string, ...args: any[]) {
        if (this._deleteFunc !== undefined) {
            const item = this._items.get(id);
            if (item !== undefined) {
                this._deleteFunc(item, ...args);
            }
        }
        this._items.delete(id);
    }
    /**
     * Queue an entry for deletion.
     *
     * @param {string} id The ID of the entry to delete.
     * @param {...any[]} args Deletion arguments.
     * @memberof Manager
     */
    public queueForDeletion(id: string, ...args: any[]) {
        this._deletionQueue.push({id, args});
    }
    /**
     * Delete any entries that are queued for deletion.
     *
     * @memberof Manager
     */
    public deleteQueued() {
        for (const queueData of this._deletionQueue) {
            if (this._deleteFunc !== undefined) {
                const item = this._items.get(queueData.id);
                if (item !== undefined) {
                    this._deleteFunc(item, ...queueData.args);
                }
            }
            this._items.delete(queueData.id);
        }
        this._deletionQueue = [];
    }
}
