<script>
	import '../app.pcss';
	import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

	register('en', () => import('$lib/i18n/locales/en.json'));
	register('en-US', () => import('$lib/i18n/locales/en.json'));
	register('ru', () => import('$lib/i18n/locales/ru.json'));

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
