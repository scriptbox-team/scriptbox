import Map from "map";
import SerializedObjectCollection from "serialized-object-collection";
import Set from "set";
import WeakMap from "weak-map";

//tslint:disable
type ClassInterface = {new (...args: any[]): any};
// tslint:enable

interface SerializedObject {
    module?: string;
    object: any;
    componentID?: string;
}

interface SerializedReference {
    objID: number;
    parentID: number;
    name: string;
}

export default class ObjectSerializer {
    public static serialize<T extends SerializedObjectCollection>(
            invClassList: WeakMap<ClassInterface, string>,
            objects: object[],
            skip: (arg: any) => boolean,
            handleSkip: (collect: T, parentID: number, obj: any, name: string) => void,
            getComponentID: (object: any) => string | undefined
        ) {
        const collect = {
            objects: [],
            references: []
        };
        const objectQueue = [...objects];
        const refSet = new WeakMap<object, number>(objectQueue.map((obj, index) => [obj, index]));
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < objectQueue.length; i++) {
            try {
                const obj = objectQueue[i];
                if (obj instanceof Map) {
                    this._serializeSingleMap(
                        i,
                        collect,
                        objectQueue,
                        refSet,
                        invClassList,
                        obj,
                        skip,
                        handleSkip,
                        getComponentID
                    );
                }
                else if (obj instanceof Set) {
                    this._serializeSingleSet(
                        i,
                        collect,
                        objectQueue,
                        refSet,
                        invClassList,
                        obj,
                        skip,
                        handleSkip,
                        getComponentID
                    );
                }
                else {
                    this._serializeSingle(
                        i,
                        collect,
                        objectQueue,
                        refSet,
                        invClassList,
                        obj,
                        skip,
                        handleSkip,
                        getComponentID
                    );
                }
            }
            catch (err) {
                global.log(`${err.stack}`);
            }
        }
        return collect;
    }
    public static deserialize(
            classList: Map<string, ClassInterface>,
            collection: SerializedObjectCollection,
            customClassHandler: (id: number, object: SerializedObject) => any | undefined) {
        let i = 0;
        const revivedObjects = collection.objects.map((obj) => {
            return this._deserializeSingle(i++, classList, obj, customClassHandler);
        });
        for (const ref of collection.references) {
            try {
                this._resolveReference(revivedObjects, ref);
            }
            catch (err) {
                global.log(`${err.stack}`);
            }
        }
        return revivedObjects;
    }
    private static _serializeSingle<T extends SerializedObjectCollection>(
            loc: number,
            collect: T,
            objectQueue: object[],
            refSet: WeakMap<object, number>,
            classPrototypeLookup: WeakMap<ClassInterface, string>,
            obj: any,
            skip: (arg: any) => boolean,
            handleSkip: (collect: T, parentID: number, obj: any, name: string) => void,
            getComponentID: (object: any) => string | undefined
        ) {
        const serializedObject = {} as object;
        const props = Object.keys(obj);
        let module: undefined | string;
        const prototype = Object.getPrototypeOf(obj);
        if (prototype !== undefined && classPrototypeLookup.has(prototype)) {
            module = classPrototypeLookup.get(prototype);
        }
        else if (Array.isArray(obj)) {
            module = "array";
        }
        for (const prop of props) {
            switch (typeof obj[prop]) {
                case "object": {
                    if (obj[prop] === null) {
                        serializedObject[prop] = obj[prop];
                        continue;
                    }
                    if (skip(obj[prop])) {
                        handleSkip(collect, loc, obj[prop], prop);
                        continue;
                    }
                    if (!refSet.has(obj[prop])) {
                        const id = objectQueue.length;
                        objectQueue.push(obj[prop]);
                        refSet.set(obj[prop], id);
                    }
                    collect.references.push({objID: refSet.get(obj[prop]), parentID: loc, name: prop});
                    break;
                }
                case "function": {
                    // Do nothing; Functions can't be serialized
                    break;
                }
                default: {
                    serializedObject[prop] = obj[prop];
                    break;
                }
            }
        }
        collect.objects.push({object: serializedObject, module, componentID: getComponentID(obj)});
    }
    private static _serializeSingleMap<T extends SerializedObjectCollection>(
        loc: number,
        collect: T,
        objectQueue: object[],
        refSet: WeakMap<object, number>,
        classPrototypeLookup: WeakMap<ClassInterface, string>,
        obj: Map<any, any>,
        skip: (arg: any) => boolean,
        handleSkip: (collect: T, parentID: number, obj: any, name: string) => void,
        getComponentID: (object: any) => string | undefined
    ) {
        const serializedObject = {} as object;
        const iterator = obj.entries();
        let module: undefined | string;
        const prototype = Object.getPrototypeOf(obj);
        if (prototype !== undefined && classPrototypeLookup.has(prototype)) {
            module = classPrototypeLookup.get(prototype);
        }
        let i = 0;
        for (const elem of iterator) {
            const id = objectQueue.length;
            objectQueue.push(elem);
            refSet.set(elem, id);
            collect.references.push({objID: id, parentID: loc, name: "" + i++});
        }
        collect.objects.push({object: serializedObject, module, componentID: getComponentID(obj)});
    }
    private static _serializeSingleSet<T extends SerializedObjectCollection>(
        loc: number,
        collect: T,
        objectQueue: object[],
        refSet: WeakMap<object, number>,
        classPrototypeLookup: WeakMap<ClassInterface, string>,
        obj: Set<any>,
        skip: (arg: any) => boolean,
        handleSkip: (collect: T, parentID: number, obj: any, name: string) => void,
        getComponentID: (object: any) => string | undefined
    ) {
        const serializedObject = {} as object;
        const iterator = obj.values();
        let module: undefined | string;
        const prototype = Object.getPrototypeOf(obj);
        if (prototype !== undefined && classPrototypeLookup.has(prototype)) {
            module = classPrototypeLookup.get(prototype);
        }
        let num = 0;
        for (const elem of iterator) {
            // Just to make things easier
            const i = num++;
            switch (typeof elem) {
                case "object": {
                    if (elem === null) {
                        serializedObject[i] = elem;
                        continue;
                    }
                    if (skip(elem)) {
                        handleSkip(collect, loc, elem, "" + i);
                        continue;
                    }
                    if (!refSet.has(elem)) {
                        const id = objectQueue.length;
                        objectQueue.push(elem);
                        refSet.set(elem, id);
                    }
                    collect.references.push({objID: refSet.get(elem), parentID: loc, name: "" + i});
                    break;
                }
                case "function": {
                    // Do nothing; Functions can't be serialized
                    break;
                }
                default: {
                    serializedObject[i] = elem;
                    break;
                }
            }
        }
        collect.objects.push({object: serializedObject, module, componentID: getComponentID(obj)});
    }
    private static _deserializeSingle(
        id: number,
        classList: Map<string, ClassInterface>,
        data: SerializedObject,
        customClassHandler: (id: number, object: SerializedObject) => any | undefined
    ) {
        let revivedObj = {} as any;
        const custom = customClassHandler(id, data);
        if (custom === undefined) {
            if (data.module !== undefined && classList.has(data.module)) {
                revivedObj = new (classList.get(data.module))();
            }
            return Object.assign(revivedObj, data.object);
        }
        else {
            return custom;
        }
    }
    private static _resolveReference(
        revivedObjects: any[],
        reference: SerializedReference
    ) {
        const parent = revivedObjects[reference.parentID];
        const child = revivedObjects[reference.objID];
        if (parent instanceof Map) {
            return;
            // This is handled elsewhere
            // Because the elements are arrays
            // Which may first need to have their references resoolved
        }
        else if (parent instanceof Set) {
            parent.add(child);
        }
        else {
            parent[reference.name] = child;
        }
    }
}
