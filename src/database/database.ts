import { MongoClient } from "mongodb";
import Collection from "./collection";

export default class Database {
    private _collections: string[];
    private _client!: MongoClient;
    private _uri: string;
    constructor(uri: string = "mongodb://localhost:27017", collections: string[]) {
        this._uri = uri;
        this._collections = collections;
    }

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

    public async close() {
        await this._client.close();
    }

    private async _get(collectionName: string, id: string) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        return await collection.findOne({id});
    }

    private async _getMany(collectionName: string, getBy: object, sort: object = {}) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        return await collection.find(getBy).sort(sort).toArray();
    }

    private async _insert(collectionName: string, document: object) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.insertOne(document);
    }

    private async _insertMany(collectionName: string, documents: object[]) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.insertMany(documents);
    }

    private async _update(collectionName: string, id: string, document: object) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.replaceOne({id}, document);
    }

    private async _delete(collectionName: string, id: string) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.deleteOne({id});
    }

    private async _drop(collectionName: string) {
        const database = this._client.db("scriptbox");
        const collection = database.collection(collectionName);
        await collection.drop();
    }
}
