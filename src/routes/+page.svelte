<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { Button, Fileupload, Select } from 'flowbite-svelte';
	import FitParser from 'fit-file-parser';
	import MyMeta from '../components/MyMeta.svelte';
	import Header from '../components/Header.svelte';
	import Highcharts from '../components/Highcharts.svelte';
	import Tracker from '../components/Tracker.svelte';
	import SupportMe from '../components/SupportMe.svelte';

	let files: any[] = [];
	let metricsData: any[] = [];

	const fileInputName = 'fileInput';

	const getUploadElement = () => {
		return document.getElementById(fileInputName) as HTMLInputElement | null;
	};

	const handleFileUpload = () => {
		const input = getUploadElement();
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

			fitParser.parse(
				arrayBuffer,
				(
					error: any,
					data: {
						devices: {
							manufacturer: string;
							product_name: any;
						}[];
						records: any;
					}
				) => {
					if (error) {
						console.error('Error parsing FIT file:', error);
						return;
					}
					// console.log(data);
					const rideName =
						(data?.devices[0]?.manufacturer || '') +
						' ' +
						(data?.devices[0]?.product_name || file.name);
					metricsData[index++] = { name: rideName, data: data.records };
				}
			);
		}
	};

	const clear = () => {
		metricsData = [];

		const fileInput = getUploadElement();
		if (fileInput) {
			fileInput.value = '';
		}
	};

	const titleTemplate = 'Simple FIT file analyser';
	const description =
		"Compare FIT files data - power, cadence, HR. The app doesn't store anything and works in your browser, no strings attached.";

	const selectOptions = [
		{ value: 'alignNone', name: 'do not align activities' },
		{ value: 'alignByStart', name: 'align by start time of activities' },
		{ value: 'alignByEnd', name: 'align by end time of acitivities' },
		{ value: 'alignOneAfterAnother', name: 'activities follow each other' }
	];

	let selectedAlignMethod: string;

	const alignNone = () => {
		// metricsData = originalMetricsData;
	};

	const alignByStart = () => {
		const temp = metricsData;
		if (temp.length > 1) {
			const start = Date.parse(temp[0].data[0]['timestamp']);
			for (let i = 1; i < temp.length; i++) {
				const diff = temp[i].data[0]['timestamp'] - start;
				temp[i].data = temp[i].data.map((x) => {
					x.timestamp = new Date(Date.parse(x.timestamp) - diff);
					return x;
				});
			}
		}
		metricsData = temp;
	};
	const alignByEnd = () => {};
	const alignOneAfterAnother = () => {};

	const alignActivities = (event: Event) => {
		// console.log(event.target.value);
		if (metricsData.length > 1) {
			const cb = event.target.value;
			eval(cb)();
		}
	};
</script>

<MyMeta {titleTemplate} {description} />
<svelte:head>
	<title>{titleTemplate}</title>
	<Tracker />
</svelte:head>

<main>
	<div class="my-4">
		{#if metricsData.length === 0}
			<Header {description} />
		{/if}
		<Fileupload
			id="fileInput"
			multiple
			on:change={handleFileUpload}
			accept=".fit"
			class="inline-block w-2/4"
		/>
		<Select
			class="inline-block w-1/4"
			items={selectOptions}
			bind:value={selectedAlignMethod}
			on:change={alignActivities}
		/>
		{#if metricsData.length > 0}
			<Button on:click={clear}>Clear dataset</Button>
		{/if}
	</div>
	{#if metricsData.length > 0}
		<Highcharts {metricsData} />
	{/if}

	<SupportMe />
</main>

<style>
	/* Add your styles here */
</style>
