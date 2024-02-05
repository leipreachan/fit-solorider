<script>
	import { DarkMode } from 'flowbite-svelte';
	import { theme } from '../stores/theme';

	let currentTheme = $theme;
	const toggleTheme = () => {
		theme.set(currentTheme === 'light' ? 'dark' : 'light');
	};
</script>

<button type="button" on:click={toggleTheme} class="darkmode">
	<DarkMode />
</button>

<style lang="postcss">
	.darkmode {
		@apply absolute right-2 top-2 xs:w-1/12;
	}
</style>