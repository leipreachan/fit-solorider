<script lang="ts">
	import Table from './Table.svelte';
	import { _ } from 'svelte-i18n';
	import { afterUpdate } from 'svelte';

	export let metric: string;
	export let seriesData: any;
	export let selectedRows: any = [];
	let tableData: any;

	const sourceNameParam = 'Source';

	export const metricOptions = new Map([
		['power', { units: ' ' + $_('watts') }],
		['cadence', { units: ' ' + $_('rpm') }],
		['heart_rate', { units: ' ' + $_('bpm') }],
		['altitude', { units: $_('meters'), shortUnits: $_('m_meters'), type: 'area' }],
		['temperature', { units: $_('degrees'), shortUnits: '°' }]
	]);

	const selectedRowHandler = (event: Event | null | undefined) => {
		const target = (event?.target as HTMLSelectElement).value || null;
		const asList = new Set(selectedRows);
		if (asList.has(target)) {
			asList.delete(target);
		} else {
			asList.add(target);
		}
		selectedRows  = Array.from(asList);
	};

	const isNumber = (n: any) => {
		return !isNaN(parseFloat(n)) && !isNaN(n - 0);
	};

	const getNumsFromData = (data: any[]) => {
		return data.filter((x) => isNumber(x));
	};

	const calculateNormalizedPower = (data: any[]) => {
		const dataPoints = getNumsFromData(data);
		if (dataPoints.length === 0) {
			return null;
		}

		const windowSize = 30; // Rolling 30-second window size

		// Step 1: Calculate rolling 30-second average power
		const rollingAverages = [];
		for (let i = 0; i <= dataPoints.length - windowSize; i++) {
			const window = dataPoints.slice(i, i + windowSize);
			const averagePower = window.reduce((sum, value) => sum + value, 0) / windowSize;
			rollingAverages.push(averagePower);
		}

		// Step 2: Raise the resulting values to the fourth power
		const fourthPowerValues = rollingAverages.map((value) => Math.pow(value, 4));

		// Step 3: Determine the average of these values
		const averageFourthPower =
			fourthPowerValues.reduce((sum, value) => sum + value, 0) / fourthPowerValues.length;

		// Step 4: Find the fourth root of the resulting average
		return Math.round(Math.pow(averageFourthPower, 1 / 4)) || null;
	};

	const calculateAverage = (data: any[]) => {
		const nums = getNumsFromData(data);
		return nums.length > 0
			? Math.round(nums.reduce((acc, curr) => acc + curr, 0) / nums.length)
			: null;
	};

	const calculateMin = (data: any[]) => {
		const nums = getNumsFromData(data);
		return nums.length > 0 ? Math.round(Math.min(...nums)) : null;
	};

	const calculateMax = (data: any[]) => {
		const nums = getNumsFromData(data);
		return nums.length > 0 ? Math.round(Math.max(...nums)) : null;
	};

	const calculateTotalElevation = (data: any[]) => {
		if (getNumsFromData(data).length === 0) {
			return null;
		}
		let elevationGain = 0;
		let previousAltitude = data[0];

		for (let i = 1; i < data.length; i++) {
			const currentAltitude = data[i];
			const altitudeChange = currentAltitude - previousAltitude;

			if (altitudeChange > 0) {
				elevationGain += altitudeChange;
			}

			previousAltitude = currentAltitude;
		}

		return Math.round(elevationGain);
	};

	const percDiff = (a: number, b: number) => {
		return a === 0 ? 100 : Math.round(((b - a) * 100) / a);
	};

	const addPowerData = (name: string, data: any, firstRow: { [x: string]: { value: any } }) => {
		return addAvgMaxData(name, 'power', data, firstRow, {
			Average: calculateAverage,
			// @ts-ignore
			Normalised: calculateNormalizedPower,
			Max: calculateMax
		});
	};

	const addTemperatureData = (
		name: string,
		data: any,
		firstRow: { [x: string]: { value: any } }
	) => {
		return addAvgMaxData(name, 'temperature', data, firstRow, {
			Average: calculateAverage,
			// @ts-ignore
			Min: calculateMin,
			Max: calculateMax
		});
	};

	const addAltitudeData = (name: string, data: any, firstRow: { [x: string]: { value: any } }) => {
		return addAvgMaxData(name, 'altitude', data, firstRow, {
			Average: calculateAverage,
			Max: calculateMax,
			// @ts-ignore
			Gained: calculateTotalElevation
		});
	};

	const addAvgMaxData = (
		sourceName: string,
		metricName: string,
		data: any[],
		firstRow: { [x: string]: { value: any } },
		fields = {
			Average: calculateAverage,
			Max: calculateMax
		}
	) => {
		const result: any = { [sourceNameParam]: { value: sourceName, diff: '', units: '' } };
		const units =
			metricOptions.get(metricName)?.shortUnits || metricOptions.get(metricName)?.units || '';
		for (let [k, cb] of Object.entries(fields)) {
			const value = cb(data);
			// const mName = $_(k.toLowerCase()) + ' ' + $_(metricName);
			let diff = 0;
			const frm = Object.entries(firstRow[k] || {});
			if (frm.length > 0 && firstRow[k].value !== null && value !== null) {
				diff = percDiff(firstRow[k].value, value);
			}
			result[k] = { value, diff, units };
		}
		return result;
	};

	const prepareTableData = (
		field: string,
		sourceName: string,
		rawData: any[],
		firstRow: {
			[x: string]: { value: any } | { value: any };
		}
	) => {
		switch (field) {
			case 'power':
				return addPowerData(sourceName, rawData, firstRow);
			case 'temperature':
				return addTemperatureData(sourceName, rawData, firstRow);
			case 'altitude':
				return addAltitudeData(sourceName, rawData, firstRow);
			default:
				return addAvgMaxData(sourceName, field, rawData, firstRow);
		}
	};

	const updateTableData = async (field: string, value: any[], fullRedraw = false) => {
		if (!value) {
			return;
		}
		let newData = fullRedraw ? [] : tableData || [];
		const sources = new Set(
			newData.length > 0 ? newData.map((x: { Source: { value: any } }) => x.Source.value) : []
		);
		tableData = value
			.filter((x) => !sources.has(x.name))
			.reduce((accum, { name, data }) => {
				const firstRow = accum[0] || {};
				const rawData = data.map((x: any[]) => x[1]);
				const td = prepareTableData(field, name, rawData, firstRow);
				return [...accum, td];
			}, newData);
	};

	afterUpdate(() => {
		if (seriesData) {
			updateTableData(metric, seriesData);
		}
	});
</script>

<main>
	{#if tableData?.length > 0}
		<Table
			{...{tableData, metric}}
			selectedRowHandler={metric === 'power' ? selectedRowHandler : null}
		/>
	{/if}
</main>
