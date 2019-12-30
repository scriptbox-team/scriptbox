import { MongoClient } from "mongodb";
import Collection from "./collection";

/**
 * An interface with a NoSQL database.
 * This is used by getting a collection through getCollection and using that
 * collection where appropriate.
 *
 * @export
 * @class Database
 * @module database
 */
export default class Database {
    private _collections: string[];
    private _client!: MongoClient;
    private _uri: string;
    /**
     * Creates an instance of Database.
     * @param {string} [uri="mongodb://localhost:27017"] The URI of the database to connect to.
     * @param {string[]} collections The collections which should be created in the database if they don't exist.
     * @memberof Database
     */
    constructor(uri: string = "mongodb://localhost:27017", collections: string[]) {
        this._uri = uri;
        this._collections = collections;
    }

    /**
     * Connect with the database.
     *
     * @memberof Database
     */
    public async connect() {
        this._client = await MongoClient.connect(this._uri, { useUnifiedTopology: true, ignoreUndefined: true });
        const database = this._client.db("scriptbox");
        for (const collectionName of this._collections) {
            const collectionsWithName = await database.listCollections({name: collectionName}).toArray();
            if (collectionsWithName.length === 0) {
                // Collection does not exist; create it
                const collection = await database.createCollection(collectionName);
                collection.createIndex({id: 1}, {unique: true});
            }
        }
    }

    /**
     * Get a collection from the database.
     * This creates an instance of the Collection class.
     *
     * @param {string} name The name of the collection.
     * @returns The collection.
     * @memberof Database
     */
    public getCollection(name: string) {
        return new Collection(name, {
            insert: (document) => this._insert(name, document),
            update: (id, document) => this._update(name, id, document),
            delete: (id) => this._delete(name, id),
            get: (id) => this._get(name, id),
            getMany: (getBy) => this._getMany(name, getBy),
            drop: () => this._drop(name),
            insertMany: (documents) => this._insertMany(name, documents)
        });
    }

    /**
     * Disconnect with the database.
     *
     * @memberof Database
     */
    public async close() {
        await this._client.close();
    }

    /**
     * Get a document from a collection.
     *
     * @private
     * @param {string} collectionName The name of the collection to get from.
     * @param {string} id The ID to get the document using.
     * @returns The document.
     * @memberof Database
     */
    private async _get(collectionName: string, id: string) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        return await collection.findOne({id});
    }

    /**
     * Get multiple documents from a collection.
     *
     * @private
     * @param {string} collectionName The name of the collection to get from.
     * @param {object} getBy The search query to use.
     * @param {object} [sort={}] The sorting method to use.
     * @returns A list of documents.
     * @memberof Database
     */
    private async _getMany(collectionName: string, getBy: object, sort: object = {}) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        return await collection.find(getBy).sort(sort).toArray();
    }

    /**
     * Insert a document into a collection.
     *
     * @private
     * @param {string} collectionName The name of the collection to insert into.
     * @param {object} document The document to insert.
     * @memberof Database
     */
    private async _insert(collectionName: string, document: object) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.insertOne(document);
    }

    /**
     * Insert multiple documents into a collection.
     *
     * @private
     * @param {string} collectionName The name of the collection to insert into.
     * @param {object[]} documents The documents to insert.
     * @memberof Database
     */
    private async _insertMany(collectionName: string, documents: object[]) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.insertMany(documents);
    }

    /**
     * Update an existing document in a collection.
     *
     * @private
     * @param {string} collectionName The name of the collection to update the document in.
     * @param {string} id The ID of the document to update.
     * @param {object} document The new document to replace the old one.
     * @memberof Database
     */
    private async _update(collectionName: string, id: string, document: object) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.replaceOne({id}, document);
    }

    /**
     * Delete a document in a collection.
     *
     * @private
     * @param {string} collectionName The name of the collection to delete the document from.
     * @param {string} id The ID of the document to delete.
     * @memberof Database
     */
    private async _delete(collectionName: string, id: string) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.deleteOne({id});
    }

    /**
     * Drop a collection.
     *
     * @private
     * @param {string} collectionName The name of the collection to drop.
     * @memberof Database
     */
    private async _drop(collectionName: string) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.drop();
    }
}
