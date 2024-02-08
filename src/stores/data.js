import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const initialData = browser ? JSON.parse(window.localStorage?.metricsData || "[]") ?? [] : [];
const initialDataShift = browser ? JSON.parse(window.localStorage?.metricsDataShift || "[]") ?? [] : [];
const initialAlignMethod = browser ? window.localStorage?.alignMethod ?? '' : '';

export const metricsData = writable(initialData || []);
export const metricsDataShift = writable(initialDataShift || []);
export const alignMethod = writable(initialAlignMethod || '');

metricsData.subscribe((value) => {
    if (browser) {
        window.localStorage.metricsData = JSON.stringify(value);
    }
});

metricsDataShift.subscribe((value) => {
    if (browser) {
        window.localStorage.metricsDataShift = JSON.stringify(value);
    }
});

alignMethod.subscribe((value) => {
    if (browser) {
        window.localStorage.alignMethod = value;
    }
});