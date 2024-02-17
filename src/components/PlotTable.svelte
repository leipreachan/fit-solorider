<!-- src/components/Highcharts.svelte -->
<script lang="ts">
	import { onMount, beforeUpdate } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { metricsData, metricsDataShift } from '$lib/stores/data';
	import MetricBlock from './MetricBlock.svelte';

	const containerName = 'chartContainer_';

	let seriesData: any = {};
	let metricNames: Set<string> = new Set();

	let syncShift = 0;

	const charts = new Map();

	const priority = new Map([
		['power', { units: ' ' + $_('watts') }],
		['cadence', { units: ' ' + $_('rpm') }],
		['heart_rate', { units: ' ' + $_('bpm') }],
		['altitude', { units: $_('meters'), shortUnits: $_('m_meters'), type: 'area' }],
		['temperature', { units: $_('degrees'), shortUnits: '°' }]
	]);

	const excludeMetrics = new Set([
		'timestamp',
		'elapsed_time',
		'timer_time',
		'distance',
		'position_long',
		'position_lat',
		'activity_type',
		'resistance',
		'fractional_cadence',
		'accumulated_power'
	]);

	const filterNulls = new Set(['battery_soc']);

	const initChart = (metricName: string, series: any | null = null) => {
		if (!charts.has(metricName)) {
			// options.title.text = $_(metricName).replaceAll('_', ' ');
			// options.yAxis.title.text = priority.get(metricName)?.units || '';
			// options.chart.type = priority.get(metricName)?.type || 'line';
			// if (series !== null) {
			// 	options.series = series;
			// }
			// //@ts-ignore
			// try {
			// 	const chart = Highcharts.chart(containerName + metricName, options, () => {});
			// 	charts.set(metricName, chart);
			// } catch (e) {
			// 	console.error(`Error while initialising chart '${containerName + metricName}'`, e, options);
			// }
		}
		return charts.get(metricName);
	};

	onMount(() => {});

	async function drawTables(field: string, value: any[], fullRedraw = false) {
		// let newData = fullRedraw ? [] : tableData[field] || [];
		// const sources = new Set(
		// 	newData.length > 0 ? newData.map((x: { Source: { value: any } }) => x.Source.value) : []
		// );
		// tableData[field] = value
		// 	.filter((x) => !sources.has(x.name))
		// 	.reduce((accum, { name, data }) => {
		// 		const firstRow = accum[0] || {};
		// 		const rawData = data.map((x: any[]) => x[1]);
		// 		const td = prepareTableData(field, name, rawData, firstRow);
		// 		return [...accum, td];
		// 	}, newData);
	}

	async function getMetricNames(data: any[]) {
		const dataMetricSet = new Set(
			data
				.flatMap((fit) => fit.data.flatMap((x: {}) => Object.keys(x)))
				.filter((k) => !excludeMetrics.has(k))
		);
		const filteredPriorityLst = Array.from(priority.keys()).filter((k) => dataMetricSet.has(k));

		metricNames = new Set([
			...Array.from(metricNames),
			...filteredPriorityLst,
			...Array.from(dataMetricSet)
		]);
	}

	function getSeriesData() {
		const result: any = {};

		console.log($metricsData);
		for (let file of $metricsData) {
			const { name, data } = file;
			const metricToFileToData: { [key: string]: any[] } = {};
			for (let point of data) {
				const ts = Date.parse(point.timestamp);
				for (let key of metricNames) {
					if (metricToFileToData[key] === undefined) {
						metricToFileToData[key] = [];
					}
					const value =
						typeof point[key] === 'object' ? point[key].value || null : point[key] || null;
					if (!(value === null && filterNulls.has(key))) {
						metricToFileToData[key].push([ts, value]);
					}
				}
			}

			for (let key of metricNames) {
				const curr = result[key] || [];
				curr.push({ name, data: metricToFileToData[key] });
				result[key] = curr;
			}
		}
		return result;
	}

	beforeUpdate(() => {
		if ($metricsData.length > 0) {
			getMetricNames($metricsData);
			seriesData = getSeriesData();
		}
		console.log(syncShift);
	});

	function shiftAllSeries(selectedOnly: boolean) {
		for (let k of metricNames) {
			shiftSeriesOfSingleChart(k, selectedOnly);
		}
	}

	function calculateShiftedSeries(value: any, selectedOnly: boolean) {
		// let id = 0;
		// const result = value.map(({ name, data }: { name: string; data: any[] }) => {
		// 	let shift = $metricsDataShift[id];
		// 	if (selectedOnly) {
		// 		shift = selectedRows.has(name) ? $metricsDataShift[id] + syncShift : $metricsDataShift[id];
		// 	}
		// 	id++;
		// 	return { name, data: data.map((x) => [x[0] + shift, x[1]]) };
		// });
		// return result;
	}

	async function shiftSeriesOfSingleChart(k: string, selectedOnly: boolean) {
		// const chart = initChart(k);
		// const series = calculateShiftedSeries(seriesData.get(k), selectedOnly);
		// for (let id = 0; id < chart.series.length; id++) {
		// chart.series[id].update({ data: series[id].data }, false);
		// }
		// chart.redraw();
	}
</script>

<div id="container_wrapper">
	{#if $metricsData.length > 0}
		{#each metricNames as metric}
			<MetricBlock
				{...{
					containerName,
					metric
				}}
				seriesData={seriesData[metric]}
				bind:syncShift
			/>
		{/each}
	{/if}
</div>
