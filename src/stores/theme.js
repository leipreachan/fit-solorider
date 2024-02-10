import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const defaultValue = browser ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : '';
const initial = browser ? window.localStorage?.theme ?? defaultValue : defaultValue;
export const theme = writable(initial || defaultValue);

theme.subscribe((value) => {
    if (browser) {
        window.localStorage.theme = value;
    }
});