<!-- src/components/Highcharts.svelte -->
<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import Highcharts from 'highcharts';
	import { writable } from 'svelte/store';
	import Shifter from './Shifter.svelte';
	import Table from './Table.svelte';
	// import Accessibility from "highcharts/modules/accessibility";

	const sourceNameParam = 'Source';
	const containerName = 'chartContainer_';

	export let metricsData: any[] = [];
	const newSeries = new Map();
	const originalSeries = new Map();
	const minRange = -65;
	const maxRange = 65;
	let metricNames = new Set();

	let shift = writable([0, 0]);
	let moreData: any = writable({});
	let extraData: any = writable({});

	function logExtremes(event: Event) {
		// if (event.userMin && event.userMax) {
		// 	const selectedBits = event.target.chart.series.map((s) =>
		// 		s.data.filter((v) => v.x >= event.userMin && v.x <= event.userMax)
		// 	);
		// 	const field = event.target.chart.container.parentNode.id.replace(containerName, '');
		// 	selectedBits.forEach((v, k) => {
		// 		prepareTableData(field, k, v);
		// 	});
		// }
	}

	const options = {
		title: {
			text: ''
		},
		colors: [
			'#fe6a35',
			'#6b8abc',
			'#d568fb',
			'#2ee0ca',
			'#fa4b42',
			'#feb56a',
			'#91e8e1',
			'#2caffe',
			'#544fc5',
			'#00e272'
		],
		chart: {
			zoomType: 'x',
			type: 'line'
		},
		tooltip: {
			valueDecimals: 0
		},
		plotOptions: {
			series: {
				lineWidth: 1
			}
		},
		xAxis: {
			type: 'datetime',
			crosshair: true,
			events: {
				afterSetExtremes: logExtremes
			}
		},
		yAxis: {
			title: {
				text: ''
			}
		},
		accessibility: {
			enabled: false
		}
		// Add additional Highcharts configuration options as needed
	};

	const charts = new Map();
	const chartSeriesNames = new Map();

	const priority = new Map([
		['power', { units: ' watts' }],
		['cadence', { units: ' rpm' }],
		['heart_rate', { units: ' bpm' }],
		['altitude', { units: 'meters', shortUnits: ' m', type: 'area' }],
		['temperature', { units: 'degrees', shortUnits: '°' }]
	]);

	const initChart = (metricName: string, series: any | null = null) => {
		if (!charts.has(metricName)) {
			options.title.text = metricName.replace('_', ' ');
			options.yAxis.title.text = priority.get(metricName)?.units || '';
			options.chart.type = priority.get(metricName)?.type || 'line';
			if (series !== null) {
				options.series = series;
			}
			//@ts-ignore
			const chart = Highcharts.chart(`${containerName}${metricName}`, options);
			charts.set(metricName, chart);
		}
		return charts.get(metricName);
	};

	onMount(() => {
		// Accessibility(Highcharts);
		// Initialize Highcharts chart on mount
		// if ([...charts].length === 0) {
		// initChart('power');
		// }
	});

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
		return Math.round(Math.pow(averageFourthPower, 1 / 4));
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
		const units = priority.get(metricName)?.shortUnits || priority.get(metricName)?.units || '';
		for (let [k, cb] of Object.entries(fields)) {
			const value = cb(data);
			const mName = `${k} ${metricName}`;
			let diff = 0;
			const frm = Object.entries(firstRow[mName] || {});
			if (frm.length > 0 && firstRow[mName].value !== null && value !== null) {
				diff = percDiff(firstRow[mName].value, value);
			}
			result[mName] = { value, diff, units };
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
				break;
			case 'temperature':
				return addTemperatureData(sourceName, rawData, firstRow);
				break;
			case 'altitude':
				return addAltitudeData(sourceName, rawData, firstRow);
				break;
			default:
				return addAvgMaxData(sourceName, field, rawData, firstRow);
		}
	};

	async function drawChart(field: string, value: { name: any; data: any }[]) {
		const chart = initChart(field);
		value.forEach(({ name, data }) => {
			const hash = name + field;
			if (chartSeriesNames.has(hash)) {
				const index = chartSeriesNames.get(hash);
				chart.series[index].update({ name, data }, false);
			} else {
				chartSeriesNames.set(hash, chart.series.length);
				chart.addSeries({ name, data }, false);
			}
		});
		chart.redraw();
	}

	async function drawTables(field: string, value: any[]) {
		const current: any = $moreData;
		let tableData = current[field] || [];
		const firstRow = tableData[0] || {};
		const sources = new Set(tableData.length > 0 ? tableData.map((x) => x.Source.value) : []);
		tableData = value
		.filter((x) => !sources.has(x.name))
		.reduce((accum, { name, data }) => {
			const rawData = data.map((x: any[]) => x[1]);
			const td = prepareTableData(field, name, rawData, firstRow);
			return [...accum, td];
		}, tableData);
		current[field] = tableData;
		moreData.set(current);
	}

	async function getMetricNames(data: any[]) {
		metricNames = new Set(data.flatMap((fit) => fit.data.flatMap((x: {}) => Object.keys(x))));

		// console.log(metricNames);
	}

	afterUpdate(() => {
		// Update chart series when data changes
		if (metricsData.length > 0) {
			const fields = [...priority.keys()];
			for (let i = 0; i < fields.length; i++) {
				const values = metricsData.map((fit) => ({
					name: fit.name,
					data: fit.data.map((x: { [x: string]: any; timestamp: string }) => [
						Date.parse(x.timestamp),
						x[fields[i]] || null
					])
				}));
				newSeries.set(fields[i], values);
			}

			for (const [field, value] of newSeries) {
				drawChart(field, value);
				drawTables(field, value);
			}

			getMetricNames(metricsData);
		}
	});

	function shiftSeries(id: number) {
		const ms = $shift.reduce((sum, cur) => sum + cur, 0);
		for (let k of priority.keys()) {
			// console.log(k);
			const chrt = initChart(k);
			if (originalSeries.get(k) === undefined) {
				originalSeries.set(k, [...chrt.options.series[id].data]);
			}
			let data = [...originalSeries.get(k)];
			data = data.map((x) => [x[0] + ms, x[1]]);
			chrt.series[id].setData(data);
			chrt.redraw(true);
		}
	}

	/**
	 * @param {Event | null | undefined} event
	 */
	function handleOnMinutesChange(event: Event | null | undefined) {
		const target = event?.target as HTMLInputElement;
		shift.set([parseInt(target.value) * 60 * 1000, $shift[1]]);
		const l = charts.get('power').series.length;
		for (let i = 1; i < l; i++) {
			shiftSeries(i);
		}
	}

	/**
	 * @param {Event | null | undefined} event
	 */
	function handleOnRangeChange(event: Event | null | undefined) {
		const target = event?.target as HTMLInputElement;
		shift.set([$shift[0], parseInt(target.value) * 1000]);
		const l = charts.get('power').series.length;
		for (let i = 1; i < l; i++) {
			shiftSeries(i);
		}
	}
</script>

<div id="container_wrapper">
	{#each priority.keys() as key}
		<div class="chart_wrapper">
			<div id={containerName + key}></div>
			{#if $moreData[key]?.length > 0}
				<Table
					tableData={[...$moreData[key], ...($extraData[key]?.length > 0 ? $extraData[key] : [])]}
				/>
			{:else}
				<center>No {key} data found in one of the uploaded files</center>
			{/if}
		</div>
		{#if key === 'power' && $moreData[key]?.length > 1}
			<Shifter {...{ minRange, maxRange, handleOnRangeChange, handleOnMinutesChange }} />
		{/if}
	{/each}
</div>

<style>
	.chart_wrapper {
		@apply mb-10;
	}
</style>
