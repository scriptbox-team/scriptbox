import Existable from "./existable";
import MetaInfo from "./meta-info";

export default class ProxyGenerator {
    public static make<T extends object>(
            obj: T,
            readOnlyProps: ReadonlyArray<(string | number | symbol)> = [],
            hiddenProps: ReadonlyArray<(string | number | symbol)> = []) {
        return new Proxy(obj, {
            getPrototypeOf: (target: T) => {
                throw new Error(`Cannot get prototype of ${target} in this context`);
            },
            setPrototypeOf: (target: T, v: any) => {
                throw new Error(`Cannot set prototype of ${target} in this context`);
            },
            isExtensible: (target: T) => {
                return false;
            },
            preventExtensions: (target: T) => {
                throw new Error(`Cannot modify extensibility of ${target} in this context`);
            },
            defineProperty: (target: T) => {
                throw new Error(`Cannot define or redefine properties of ${target} in this context`);
            },
            get: (target: T, p: string | number | symbol, receiver: any) => {
                if (p === "prototype") {
                    throw new Error(`Cannot get prototype of ${target} in this context`);
                }
                else if (p in hiddenProps) {
                    throw new Error(`Property ${String(p)} of ${target} is inaccessible in this context`);
                }
                return Reflect.get(target, p, receiver);
            },
            set: (target: T, p: string | number | symbol, value: any, receiver: any) => {
                if (p === "prototype") {
                    throw new Error(`Cannot set prototype of ${target} in this context`);
                }
                else if (p in readOnlyProps) {
                    throw new Error(`Property ${String(p)} of ${target} is read-only in this context`);
                }
                else if (p in hiddenProps) {
                    throw new Error(`Property ${String(p)} of ${target} is inaccessible in this context`);
                }
                return Reflect.set(target, p, value, receiver);
            },
            deleteProperty: (target: T, p: string | number | symbol) => {
                throw new Error(`Cannot delete properties of ${target} in this context`);
            }
        });
    }
    public static makeDeletable<T extends object & Existable>(
        obj: T,
        readOnlyProps: ReadonlyArray<(string | number | symbol)> = [],
        hiddenProps: ReadonlyArray<(string | number | symbol)> = [],
        exists: (ent: T) => boolean = (ent: T) => ent.exists) {
    return new Proxy(obj, {
        getPrototypeOf: (target: T) => {
            throw new Error(`Cannot get prototype of ${target} in this context`);
        },
        setPrototypeOf: (target: T, v: any) => {
            throw new Error(`Cannot set prototype of ${target} in this context`);
        },
        isExtensible: (target: T) => {
            return false;
        },
        preventExtensions: (target: T) => {
            throw new Error(`Cannot modify extensibility of ${target} in this context`);
        },
        defineProperty: (target: T) => {
            throw new Error(`Cannot define or redefine properties of ${target} in this context`);
        },
        get: (target: T, p: string | number | symbol, receiver: any) => {
            if (!exists(target) && p !== "exists") {
                throw new Error(`Cannot get property from deleted object ${target}`);
            }
            else if (p === "prototype") {
                throw new Error(`Cannot get prototype of ${target} in this context`);
            }
            else if (p in hiddenProps) {
                throw new Error(`Property ${String(p)} of ${target} is inaccessible in this context`);
            }
            return Reflect.get(target, p, receiver);
        },
        set: (target: T, p: string | number | symbol, value: any, receiver: any) => {
            if (!exists(target)) {
                throw new Error(`Cannot set property of deleted object ${target}`);
            }
            else if (p === "prototype") {
                throw new Error(`Cannot set prototype of ${target} in this context`);
            }
            else if (p in readOnlyProps) {
                throw new Error(`Property ${String(p)} of ${target} is read-only in this context`);
            }
            else if (p in hiddenProps) {
                throw new Error(`Property ${String(p)} of ${target} is inaccessible in this context`);
            }
            return Reflect.set(target, p, value, receiver);
        },
        deleteProperty: (target: T, p: string | number | symbol) => {
            throw new Error(`Cannot delete properties of ${target} in this context`);
        }
    });
}
}
