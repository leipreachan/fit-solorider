export const timeStart = (/** @type {string | undefined} */ str) => {
    if (import.meta.env.DEV) {
        console.time(str);
    }
}

export const timeEnd = (/** @type {string | undefined} */ str) => {
    if (import.meta.env.DEV) {
        console.timeEnd(str);
    }
}