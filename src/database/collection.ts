interface CollectionFunctions {
    insert: (document: object) => Promise<void>;
    update: (id: string, document: object) => Promise<void>;
    delete: (id: string) => Promise<void>;
    get: (id: string) => Promise<any>;
    getMany: (getBy: object) => Promise<any[]>;
    drop: () => Promise<void>;
}

export default class Collection {
    private _name: string;
    private _insert: (document: object) => Promise<void>;
    private _update: (id: string, document: object) => Promise<void>;
    private _delete: (id: string) => Promise<void>;
    private _get: (id: string) => Promise<any>;
    private _getMany: (getBy: object) => Promise<any[]>;
    private _drop: () => Promise<void>;
    constructor(name: string, funcs: CollectionFunctions) {
        this._name = name;
        this._insert = funcs.insert;
        this._update = funcs.update;
        this._delete = funcs.delete;
        this._get = funcs.get;
        this._getMany = funcs.getMany;
        this._drop = funcs.drop;
    }
    public async insert(document: object) {
        await this._insert(document);
    }
    public async update(id: string, document: object) {
        await this._update(id, document);
    }
    public async delete(id: string) {
        await this._delete(id);
    }
    public async get(id: string) {
        return await this._get(id);
    }
    public async getMany(getBy: object) {
        return await this._getMany(getBy);
    }
    public async drop() {
        await this._drop();
    }
}
