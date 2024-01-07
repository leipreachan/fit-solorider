<!-- src/routes/+page.svelte -->
<script>
	import FitParser from 'fit-file-parser';
	import Highcharts from '../components/Highcharts.svelte';

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
				lengthUnit: 'km',
			});

			fitParser.parse(arrayBuffer, (error, data) => {
				if (error) {
					console.error('Error parsing FIT file:', error);
					return;
				}
				metricsData[index++] = { name: file.name, data: data.records };
			});
		}
	};

	const clear = () => {
		metricsData = [];
	};
</script>

<style>
    /* Add your styles here */
</style>

<main>
	<input type="file" id="fileInput" multiple on:change={handleFileUpload} accept=".fit" />
	{#if metricsData.length > 0}
		<button on:click={clear}>Clear dataset</button>
		<Highcharts {metricsData}/>
	{/if}
</main>
