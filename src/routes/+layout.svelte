<script>
	import '../app.pcss';
	import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

	register('en', () => import('$lib/i18n/locales/en.json'));
	register('en-US', () => import('$lib/i18n/locales/en.json'));
	register('en-GB', () => import('$lib/i18n/locales/en.json'));
	register('es', () => import('$lib/i18n/locales/es.json'));
	register('fr', () => import('$lib/i18n/locales/fr.json'));
	register('de', () => import('$lib/i18n/locales/de.json'));
	register('ua', () => import('$lib/i18n/locales/ua.json'));
	register('ru', () => import('$lib/i18n/locales/ru.json'));
	register('it', () => import('$lib/i18n/locales/it.json'));
	register('pt', () => import('$lib/i18n/locales/pt.json'));
	register('pl', () => import('$lib/i18n/locales/pl.json'));
	register('ar', () => import('$lib/i18n/locales/ar.json'));
	register('zh', () => import('$lib/i18n/locales/zh.json'));
	register('ko', () => import('$lib/i18n/locales/ko.json'));
	register('jp', () => import('$lib/i18n/locales/jp.json'));

	const setup = async () => {
		await init({
			fallbackLocale: 'en',
			initialLocale: getLocaleFromNavigator()
		});
	};
	const setupResult = setup();
</script>

{#await setupResult}
	<p>Loading...</p>
{:then}
	<slot />
{/await}
