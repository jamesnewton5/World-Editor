export function queueMicrotask(callback: Function) {
    return new Promise((resolve) => {
        resolve(true);
    }).then(callback());
}

export function clamp(input: number, min: number, max: number) {
    return Math.min(Math.max(input, min), max);
}

export function compose(...funcs: Array<any>) {
    return (initialValue: any) => funcs.reduceRight((accumulator, func) => func(accumulator), initialValue);
}

export function memoise(func: Function) {
    // Stored in closure
    const cache = new Map();
    const newFunction = (...args: Array<any>) => {
        const arg = args[0];

        if (cache.has(arg)) {
            return cache.get(arg);
        }

        const result = func(...args);
        cache.set(arg, result);
        return result;
    };
    newFunction.clearCache = function () {
        cache.clear();
    }
    return newFunction;
}

// MARK: Deep Clone
export function deepClone(source: any): typeof source {
    const dataType = typeof source;
    if (dataType === "object" && source !== null /*  >:(  */) {
        if (source instanceof Map) return cloneMap(source);
        else if (source instanceof Set) return cloneSet(source);
        else if (source instanceof Date) return cloneDate(source);
        else if (source instanceof RegExp) return cloneRegExp(source);
        else if (source instanceof Error) return cloneError(source);
        else if (source instanceof WeakRef) return cloneWeakRef(source);
        else return clonePlainObject(source);
    } else if (dataType === "function") {
        return cloneFunction(source);
    } else {
        return source; // Primitive
    }
}

function clonePlainObject(source: any) {
    const clone: typeof source = Array.isArray(source) ? [] : {};
    for (const propertyName of Object.keys(source)) {
        clone[propertyName] = deepClone(source[propertyName]);
    }
    return clone;
}

function cloneMap(source: Map<any, any>) {
    const clone = source instanceof WeakMap ? new WeakMap() : new Map();
    for (const [key, property] of source) {
        clone.set(key, deepClone(property));
    }
    return clone;
}

function cloneSet(source: Set<any>) {
    const clone = source instanceof WeakSet ? new WeakSet() : new Set();
    for (const value of source) {
        clone.add(deepClone(value));
    }
    return clone;
}

function cloneDate(source: Date): Date {
    return new Date(source);
}

function cloneRegExp(source: RegExp): RegExp {
    return new RegExp(source);
}

function cloneError(source: Error): Error {
    return source.constructor(source);
}

function cloneWeakRef(source: WeakRef<any>): WeakRef<any> | null {
    const target = source.deref();
    if (target !== undefined) return new WeakRef(target);
    return null;
}

function cloneFunction(source: Function) {
    const clone: Function = source.bind({});
    return clone;
}