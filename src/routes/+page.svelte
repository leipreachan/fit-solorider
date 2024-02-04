<!-- src/routes/+page.svelte -->
<script lang="ts">
	import MyMeta from '../components/MyMeta.svelte';
	import Highcharts from '../components/Highcharts.svelte';
	import Tracker from '../components/Tracker.svelte';
	import SupportMe from '../components/SupportMe.svelte';
	import Topbar from '../components/Topbar.svelte';
	import { _ } from 'svelte-i18n';
	import { DarkMode } from 'flowbite-svelte';

	let metricsData: any[] = [];
	let metricsDataShift: any[] = [];

	let theme = 'light';
	function toggleTheme() {
		console.log(theme);
		theme = theme === 'light' ? 'dark' : 'light';
	}
</script>

<MyMeta titleTemplate={$_('page_title')} description={$_('description')} />
<svelte:head>
	<title>{$_('page_title')}</title>
	<Tracker />
</svelte:head>

<main class="w-screen">
	<Topbar description={$_('description')} bind:metricsData bind:metricsDataShift />
	<button type="button" on:click={toggleTheme} class="darkmode">
		<DarkMode />
	</button>

	{#if metricsData.length > 0}
		<Highcharts {metricsData} {metricsDataShift} {theme} />
	{/if}

	<SupportMe />
</main>

<style lang="postcss">
	.darkmode {
		@apply absolute right-2 top-2 xs:w-1/12;
	}
</style>
