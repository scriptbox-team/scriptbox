import Existable from "./existable";

export default class ProxyGenerator {
    public static make<T extends object>(
            obj: T,
            readOnlyProps: ReadonlyArray<(string | number | symbol)> = [],
            hiddenProps: ReadonlyArray<(string | number | symbol)> = []) {
        return new Proxy(obj, {
            getPrototypeOf: (target: T) => {
                throw new Error(`Cannot get prototype of ${target.constructor.name} in this context`);
            },
            setPrototypeOf: (target: T, v: any) => {
                throw new Error(`Cannot set prototype of ${target.constructor.name} in this context`);
            },
            isExtensible: (target: T) => {
                return false;
            },
            preventExtensions: (target: T) => {
                throw new Error(`Cannot modify extensibility of ${target.constructor.name} in this context`);
            },
            defineProperty: (target: T) => {
                throw new Error(`Cannot define or redefine properties of ${target.constructor.name} in this context`);
            },
            get: (target: T, p: string | number | symbol, receiver: any) => {
                if (p === "prototype") {
                    throw new Error(`Cannot get prototype of ${target.constructor.name} in this context`);
                }
                else if (p in hiddenProps) {
                    // tslint:disable-next-line: max-line-length
                    throw new Error(`Property ${String(p)} of ${target.constructor.name} is inaccessible in this context`);
                }
                return Reflect.get(target, p, target);
            },
            set: (target: T, p: string | number | symbol, value: any, receiver: any) => {
                if (p === "prototype") {
                    throw new Error(`Cannot set prototype of ${target.constructor.name} in this context`);
                }
                else if (p in readOnlyProps) {
                    throw new Error(`Property ${String(p)} of ${target.constructor.name} is read-only in this context`);
                }
                else if (p in hiddenProps) {
                    // tslint:disable-next-line: max-line-length
                    throw new Error(`Property ${String(p)} of ${target.constructor.name} is inaccessible in this context`);
                }
                return Reflect.set(target, p, value, target);
            },
            deleteProperty: (target: T, p: string | number | symbol) => {
                throw new Error(`Cannot delete properties of ${target.constructor.name} in this context`);
            }
        });
    }
    public static makeDeletable<T extends object & Existable>(
        obj: T,
        readOnlyProps: ReadonlyArray<(string | number | symbol)> = [],
        hiddenProps: ReadonlyArray<(string | number | symbol)> = [],
        exists: (ent?: T) => boolean = (ent?: T) => ent !== undefined && ent.exists) {
    return new Proxy(obj, {
        getPrototypeOf: (target: T) => {
            throw new Error(`Cannot get prototype of ${target.constructor.name} in this context`);
        },
        setPrototypeOf: (target: T, v: any) => {
            throw new Error(`Cannot set prototype of ${target.constructor.name} in this context`);
        },
        isExtensible: (target: T) => {
            return false;
        },
        preventExtensions: (target: T) => {
            throw new Error(`Cannot modify extensibility of ${target.constructor.name} in this context`);
        },
        defineProperty: (target: T) => {
            throw new Error(`Cannot define or redefine properties of ${target.constructor.name} in this context`);
        },
        get: (target: T, p: string | number | symbol, receiver: any) => {
            if (!exists(target) && p !== "exists") {
                throw new Error(`Cannot get property from deleted object ${target.constructor.name}`);
            }
            else if (p === "prototype") {
                throw new Error(`Cannot get prototype of ${target.constructor.name} in this context`);
            }
            else if (p in hiddenProps) {
                throw new Error(`Property ${String(p)} of ${target.constructor.name} is inaccessible in this context`);
            }
            return Reflect.get(target, p, target);
        },
        set: (target: T, p: string | number | symbol, value: any, receiver: any) => {
            if (!exists(target)) {
                throw new Error(`Cannot set property of deleted object ${target.constructor.name}`);
            }
            else if (p === "prototype") {
                throw new Error(`Cannot set prototype of ${target.constructor.name} in this context`);
            }
            else if (p in readOnlyProps) {
                throw new Error(`Property ${String(p)} of ${target.constructor.name} is read-only in this context`);
            }
            else if (p in hiddenProps) {
                throw new Error(`Property ${String(p)} of ${target.constructor.name} is inaccessible in this context`);
            }
            return Reflect.set(target, p, value, target);
        },
        deleteProperty: (target: T, p: string | number | symbol) => {
            throw new Error(`Cannot delete properties of ${target.constructor.name} in this context`);
        }
    });
}
}
