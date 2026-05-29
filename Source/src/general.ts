export function queueMicrotask(callback: Function) {
    return new Promise((resolve) => {
        resolve(true);
    }).then(callback());
}