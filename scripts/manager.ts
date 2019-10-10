export default class Manager<T> {
    private _items: Map<string, T>;
    private _deletionQueue: Array<{id: string, args: any[]}>;
    private _createFunc: (id: string, ...args: any[]) => T;
    private _deleteFunc?: (item: T, ...args: any[]) => void;
    constructor(createFunc: (id: string, ...args: any[]) => T, deleteFunc?: (item: T, ...args: any[]) => void) {
        this._items = new Map<string, T>();
        this._createFunc = createFunc;
        this._deleteFunc = deleteFunc;
        this._deletionQueue = [];
    }
    public get(id: string): T | undefined {
        return this._items.get(id);
    }
    public entries() {
        return this._items.entries();
    }
    public has(id: string) {
        return this._items.has(id);
    }
    public create(id: string, ...args: any[]) {
        const item = this._createFunc(id, ...args);
        this._items.set(id, item);
        return item;
    }
    public forceDelete(id: string, ...args: any[]) {
        if (this._deleteFunc !== undefined) {
            const item = this._items.get(id);
            if (item !== undefined) {
                this._deleteFunc(item, ...args);
            }
        }
        this._items.delete(id);
    }
    public queueForDeletion(id: string, ...args: any[]) {
        this._deletionQueue.push({id, args});
    }
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
