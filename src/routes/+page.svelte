<!-- src/routes/+page.svelte -->
<script lang="ts">
	import MyMeta from '../components/MyMeta.svelte';
	import Highcharts from '../components/Highcharts.svelte';
	import Tracker from '../components/Tracker.svelte';
	import SupportMe from '../components/SupportMe.svelte';
	import Topbar from '../components/Topbar.svelte';

	let metricsData: any[] = [];
	let metricsDataShift: any[] = [];

	const titleTemplate = 'Simple FIT file analyser';
	const description =
		"Compare FIT files data - power, cadence, HR. The app doesn't store anything and works in your browser, no strings attached.";


</script>

<MyMeta {titleTemplate} {description} />
<svelte:head>
	<title>{titleTemplate}</title>
	<Tracker />
</svelte:head>

<main class="w-screen">
	<Topbar {description} bind:metricsData bind:metricsDataShift/>
	{#if metricsData.length > 0}
		<Highcharts {metricsData} {metricsDataShift} />
	{/if}

	<SupportMe />
</main>

<style>
	/* Add your styles here */
</style>
