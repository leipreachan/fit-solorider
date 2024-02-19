import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

export const locales = ['ar', 'de', 'en', 'es', 'fr', 'it', 'jp', 'ko', 'pl', 'pt', 'ru', 'ua', 'zh'];

locales.forEach(locale => {
    register(locale, () => import(`$lib/i18n/locales/${locale}.json`));
});

export const setup = async () => {
    await init({
        fallbackLocale: 'en',
        initialLocale: getLocaleFromNavigator()
    });
};