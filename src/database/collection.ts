interface CollectionFunctions {
    insert: (document: object) => Promise<void>;
    insertMany: (document: object[]) => Promise<void>;
    update: (id: string, document: object) => Promise<void>;
    delete: (id: string) => Promise<void>;
    get: (id: string) => Promise<any>;
    getMany: (getBy: object, sort: object) => Promise<any[]>;
    drop: () => Promise<void>;
}

/**
 * An interface for interacting with a database collection.
 * This should ONLY be created by a Database, and is not designed to be used on its own.
 *
 * @export
 * @class Collection
 * @module database
 */
export default class Collection {
    private _name: string;
    private _insert: (document: object) => Promise<void>;
    private _insertMany: (document: object[]) => Promise<void>;
    private _update: (id: string, document: object) => Promise<void>;
    private _delete: (id: string) => Promise<void>;
    private _get: (id: string) => Promise<any>;
    private _getMany: (getBy: object, sort: object) => Promise<any[]>;
    private _drop: () => Promise<void>;
    constructor(name: string, funcs: CollectionFunctions) {
        this._name = name;
        this._insert = funcs.insert;
        this._update = funcs.update;
        this._delete = funcs.delete;
        this._get = funcs.get;
        this._getMany = funcs.getMany;
        this._drop = funcs.drop;
        this._update = funcs.update;
        this._insertMany = funcs.insertMany;
    }
    /**
     * Insert a document into the collection.
     *
     * @param {object} document The document to insert.
     * @memberof Collection
     */
    public async insert(document: object) {
        await this._insert(document);
    }
    /**
     * Insert multiple documents into the collection.
     *
     * @param {object[]} document The documents to insert.
     * @memberof Collection
     */
    public async insertMany(document: object[]) {
        await this._insertMany(document);
    }
    /**
     * Update a document in the collection.
     *
     * @param {string} id The ID of the document to update.
     * @param {object} document The new document to replace the old one.
     * @memberof Collection
     */
    public async update(id: string, document: object) {
        await this._update(id, document);
    }
    /**
     * Delete a document in the collection.
     *
     * @param {string} id The ID to delete the document of.
     * @memberof Collection
     */
    public async delete(id: string) {
        await this._delete(id);
    }
    /**
     * Get a document in the collection.
     *
     * @param {string} id The ID of the document to get.
     * @returns The retrieved document.
     * @memberof Collection
     */
    public async get(id: string) {
        return await this._get(id);
    }
    /**
     * Get multiple documents from the collection using a NoSQL query.
     *
     * @param {object} getBy The query to search by.
     * @param {object} [sort={}] How the results should be sorted.
     * @returns The documents found by the query.
     * @memberof Collection
     */
    public async getMany(getBy: object, sort: object = {}) {
        return await this._getMany(getBy, sort);
    }
    /**
     * Drop the collection.
     *
     * @memberof Collection
     */
    public async drop() {
        await this._drop();
    }
}
