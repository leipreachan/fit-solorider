<script lang="ts">
	import { Button, Fileupload, Select } from 'flowbite-svelte';
	import Header from '../components/Header.svelte';
	import FitParser from 'fit-file-parser';
	import { metricsData, metricsDataShift, alignMethod } from '../stores/data';
	import { _ } from 'svelte-i18n';
	import {
		BlobReader,
		BlobWriter,
		ZipReader,
	} from '@zip.js/zip.js';

	export let description = '';

	const fileInputName = 'fileInput';
	const fitFileConfig = {
		force: true,
		speedUnit: 'km/h',
		lengthUnit: 'm'
	};
	const fitParser = new FitParser(fitFileConfig);

	const handleFileUpload = (e: any) => {
		const input = e.target;
		const files = Array.from(input?.files || []);
		for (const file of files) {
			console.log(file);
			if (file.type === 'application/vnd.ant.fit') {
				parseFitFile(file);
			}
			if (file.type === 'application/zip') {
				parseZipFile(file);
			}
		}
		alignActivities();
	};

	const parseFitFile = async (file) => {
		const fileName = file.name;
		fitParser.parse(
			await file.arrayBuffer(),
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
					console.error($_('error_parsing_fit') + " " + fileName, error);
					return;
				}
				const rideName =
					(data?.devices[0]?.manufacturer || '') +
					' ' +
					(data?.devices[0]?.product_name || fileName);
				metricsData.set([...$metricsData, { name: rideName, data: data.records }]);
				metricsDataShift.set($metricsData.map(() => 0));
			}
		);
	};

	const parseZipFile = async (zipFileBlob) => {
		const zip = new ZipReader(new BlobReader(zipFileBlob));
		const entries = await zip.getEntries();
		for(const file of entries) {
			if (file?.filename?.endsWith('.fit') && !file?.filename?.startsWith('__MACOSX/') && !file?.directory) {
				const binaryFile = await file.getData(new BlobWriter());
				binaryFile.name = file.filename;
				parseFitFile(binaryFile);
			}
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

<div class="w-11/12 px-2 py-2 xs:flex xs:flex-wrap">
	{#if $metricsData.length === 0}
		<Header {description} />
	{/if}
	<Fileupload
		id={fileInputName}
		multiple
		on:change={handleFileUpload}
		accept="application/vnd.ant.fit, application/zip"
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
