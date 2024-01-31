<script>
	import '../app.pcss';
	import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

	const locales = ['ar', 'de', 'en', 'en-GB', 'en-US', 'es', 'fr', 'it', 'jp', 'ko', 'pl', 'pt', 'ru', 'ua', 'zh'];

	locales.forEach(locale => {
		register(locale, () => import(`$lib/i18n/locales/${locale}.json`));
	});

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
