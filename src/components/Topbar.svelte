<script lang="ts">
	import { Button, Fileupload, Select } from 'flowbite-svelte';
	import Header from '../components/Header.svelte';
	import FitParser from 'fit-file-parser';
	import {metricsData, metricsDataShift, alignMethod} from '../stores/data';
	import { _ } from 'svelte-i18n';

	// let metricsData = $metricsData;
	// let metricsDataShift = $metricsDataShift;

	export let description = '';

	let files: any[] = [];
	const fileInputName = 'fileInput';
	const fitFileConfig = {
		force: true,
		speedUnit: 'km/h',
		lengthUnit: 'm'
	};

	const handleFileUpload = (e: any) => {
		const input = e.target;
		files = Array.from(input?.files || []);
		parseFitFiles();
	};

	const parseFitFiles = async () => {
		for (const file of files) {
			const arrayBuffer = await file.arrayBuffer();
			const fitParser = new FitParser(fitFileConfig);

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
						console.error($_('error_parsing_fit'), error);
						return;
					}
					// console.log(data);
					const rideName =
						(data?.devices[0]?.manufacturer || '') +
						' ' +
						(data?.devices[0]?.product_name || file.name);
					metricsData.set([...$metricsData, { name: rideName, data: data.records }]);
					metricsDataShift.set($metricsData.map(() => 0));
				}
			);
			alignActivities();
		}
	};

	const clear = () => {
		metricsData.set([]);
		metricsDataShift.set([]);
		alignMethod.set('');

		const fileInput = document.getElementById(fileInputName) as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	};

	const selectOptions = ['alignNone', 'alignByStart', 'alignByEnd', 'alignOneAfterAnother'].map(
		(x) => ({ value: x, name: $_(x) })
	);

	const alignNone = () => {
		return $metricsDataShift.map(() => 0);
	};

	const alignByStart = () => {
		const temp = [0];
		const start = Date.parse($metricsData[0].data[0].timestamp);
		for (let i = 1; i < $metricsDataShift.length; i++) {
			temp[i] = start - Date.parse($metricsData[i].data[0].timestamp);
		}
		return temp;
	};

	const alignByEnd = () => {
		const temp = [0];
		const last = Date.parse($metricsData[0].data[$metricsData[0].data.length - 1].timestamp);
		for (let i = 1; i < $metricsDataShift.length; i++) {
			const data = $metricsData[i].data;
			const lastIndex = data.length - 1;
			temp[i] = last - Date.parse(data[lastIndex].timestamp);
		}
		return temp;
	};

	const alignOneAfterAnother = () => {
		const temp = [0];
		for (let i = 1; i < $metricsData.length; i++) {
			const prevSeriesLastPointIndex = $metricsData[i - 1].data.length - 1;
			const prevSeriesLastPointTs = $metricsData[i - 1].data[prevSeriesLastPointIndex].timestamp;
			temp[i] =
				Date.parse(prevSeriesLastPointTs) -
				Date.parse($metricsData[i].data[0].timestamp) +
				temp[i - 1];
		}
		return temp;
	};

	const optionFunctions = { alignNone, alignByStart, alignByEnd, alignOneAfterAnother };

	const alignActivitiesHandler = () => {
		if ($metricsData.length > 1) {
			alignActivities();
		}
	};

	const alignActivities = () => {
		const selectedFunction = optionFunctions[$alignMethod];
		if (selectedFunction) {
			metricsDataShift.set(selectedFunction());
		}
	};
</script>

<div class="px-2 py-2 xs:flex xs:flex-wrap w-11/12">
	{#if $metricsData.length === 0}
		<Header {description} />
	{/if}
	<Fileupload
		id={fileInputName}
		multiple
		on:change={handleFileUpload}
		accept=".fit"
		class="inline-block w-1/4 xs:w-5/12"
	/>
	{#if $metricsData.length > 1}
		<Select
			class="inline-block w-2/4 xs:w-6/12"
			items={selectOptions}
			bind:value={$alignMethod}
			on:change={alignActivitiesHandler}
		/>
	{/if}
	{#if $metricsData.length > 0}
		<Button on:click={clear} class="w-auto">{$_('clear_dataset')}</Button>
	{/if}
</div>
