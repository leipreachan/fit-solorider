<!-- src/routes/+page.svelte -->
<script>
	import { Button, Fileupload } from 'flowbite-svelte';
	import { MetaTags } from 'svelte-meta-tags';
	import FitParser from 'fit-file-parser';
	import Highcharts from '../components/Highcharts.svelte';
	import Tracker from '../components/Tracker.svelte';
	import SupportMe from '../components/SupportMe.svelte';

	let files = [];
	let metricsData = [];

	const handleFileUpload = () => {
		const input = document.getElementById('fileInput');
		files = Array.from(input?.files || []);
		parseFitFiles();
	};

	const parseFitFiles = async () => {
		let index = 0;
		for (const file of files) {
			const arrayBuffer = await file.arrayBuffer();
			const fitParser = new FitParser({
				force: true,
				speedUnit: 'km/h',
				lengthUnit: 'm'
			});

			fitParser.parse(arrayBuffer, (error, data) => {
				if (error) {
					console.error('Error parsing FIT file:', error);
					return;
				}
				console.log(data);
				const rideName = (data?.devices[0]?.manufacturer || '') + ' ' + (data?.devices[0]?.product_name || file.name);
				metricsData[index++] = { name: rideName, data: data.records };
			});
		}
	};

	const clear = () => {
		metricsData = [];
		document.getElementById('fileInput').value = null;
	};

	const title = 'Simple FIT file analyser';
	const desc = 'Compare FIT files data - power, cadence, HR. The app doesn\'t store anything and works in your browser, no strings attached.';
	const hostAddr = 'fit.solorider.cc';

	$: metaTags = {
		titleTemplate: title, // Default title template.
		description: desc, // Default description.
		openGraph: {
			siteName: hostAddr,
			images: [
				{
					url: `https://${hostAddr}/og-image.webp`,
					width: 800,
					height: 600,
					alt: 'Og Image Alt'
				}
			]
		},
		twitter: {
			site: '@site',
			cardType: 'summary_large_image',
			image: `https://${hostAddr}/og-image.webp`,
			imageAlt: 'Twitter image alt'
		}
	};
</script>

<style>
    /* Add your styles here */
</style>

<MetaTags {...metaTags} />

<Tracker />

<main>
	{#if metricsData.length === 0}
		{desc}
		<br>
	{/if}
	<Fileupload id="fileInput" multiple on:change={handleFileUpload} accept=".fit" class="inline-block w-2/4" />
	{#if metricsData.length > 0}
		<Button on:click={clear}>Clear dataset</Button>
		<Highcharts {metricsData} />
	{/if}
</main>

<SupportMe />
