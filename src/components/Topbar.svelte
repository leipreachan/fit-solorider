<script lang="ts">
    import { Button, Fileupload, Select } from 'flowbite-svelte';
    import Header from '../components/Header.svelte';
    import FitParser from 'fit-file-parser';

    export let metricsData: any[] = [];
    export let metricsDataShift: any[] = [];
    export let description = '';

    let selectedAlignMethod: string = '';
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
						console.error('Error parsing FIT file:', error);
						return;
					}
					// console.log(data);
					const rideName =
						(data?.devices[0]?.manufacturer || '') +
						' ' +
						(data?.devices[0]?.product_name || file.name);
					metricsData = [...metricsData, { name: rideName, data: data.records }];
					metricsDataShift = metricsData.map(() => 0);
				}
			);
			alignActivities();
		}
	};

	const clear = () => {
		metricsData = [];
		metricsDataShift = [];
		selectedAlignMethod = '';

		const fileInput = document.getElementById(fileInputName) as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	};

    const selectOptions = [
		{ value: 'alignNone', name: 'do not align activities (reset)' },
		{ value: 'alignByStart', name: 'align by start time of activities' },
		{ value: 'alignByEnd', name: 'align by end time of acitivities' },
		{ value: 'alignOneAfterAnother', name: 'activities follow each other' }
	];

	const alignNone = () => {
		metricsDataShift = metricsDataShift.map(() => 0);
	};

	const alignByStart = () => {
		const temp = [0];
		const start = Date.parse(metricsData[0].data[0].timestamp);
		for (let i = 1; i < metricsDataShift.length; i++) {
			temp[i] = start - metricsData[i].data[0].timestamp;
		}
		metricsDataShift = temp;
	};

	const alignByEnd = () => {
		const temp = [0];
		const last = Date.parse(metricsData[0].data[metricsData[0].data.length - 1].timestamp);
		for (let i = 1; i < metricsDataShift.length; i++) {
			const data = metricsData[i].data;
			const lastIndex = data.length - 1;
			temp[i] = last - Date.parse(data[lastIndex].timestamp);
		}
		metricsDataShift = temp;
	};

	const alignOneAfterAnother = () => {
		const temp = [0];
		for (let i = 1; i < metricsData.length; i++) {
			const prevSeriesLastPointIndex = metricsData[i - 1].data.length - 1;
			const prevSeriesLastPointTs = metricsData[i - 1].data[prevSeriesLastPointIndex].timestamp;
			temp[i] =
				Date.parse(prevSeriesLastPointTs) -
				Date.parse(metricsData[i].data[0].timestamp) +
				temp[i - 1];
		}
		metricsDataShift = temp;
	};

	const optionFunctions = { alignNone, alignByStart, alignByEnd, alignOneAfterAnother };

	const alignActivitiesHandler = () => {
		if (metricsData.length > 1) {
			alignActivities();
		}
	};

	const alignActivities = () => {
		const selectedFunction = optionFunctions[selectedAlignMethod];
		if (selectedFunction) {
			selectedFunction();
		}
	};
</script>

<div class="px-2 py-2 xs:flex xs:flex-wrap">
    {#if metricsData.length === 0}
        <Header {description} />
    {/if}
    <Fileupload
        id={fileInputName}
        multiple
        on:change={handleFileUpload}
        accept=".fit"
        class="inline-block w-1/4 xs:w-6/12"
    />
    {#if metricsData.length > 1}
        <Select
            class="inline-block w-2/4 xs:w-6/12"
            items={selectOptions}
            bind:value={selectedAlignMethod}
            on:change={alignActivitiesHandler}
        />
    {/if}
    {#if metricsData.length > 0}
        <Button on:click={clear} class="w-auto">Clear dataset</Button>
    {/if}
</div>