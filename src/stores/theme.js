import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const defaultValue = 'light';
const initial = browser ? window.localStorage.theme ?? defaultValue : defaultValue;

export const theme = writable(initial || 'light');

theme.subscribe((value) => {
    if (browser) {
        window.localStorage.theme = value;
    }
});