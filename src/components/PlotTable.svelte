<!-- src/components/Highcharts.svelte -->
<script lang="ts">
	import { onMount, beforeUpdate } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { metricsData, metricsDataShift } from '$lib/stores/data';
	import MetricBlock from './MetricWrapper.svelte';

	const containerName = 'chartContainer_';

	let seriesData: any = {};
	let seriesShift: any;
	let metricNames: Set<string> = new Set();
	let fileNamesToId: Map<string, number> = new Map();

	let selectedRows: any[] = [];
	let selectedRowsShift: number = 0;


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

	onMount(() => {});

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

		let i = 0;
		for (let file of $metricsData) {
			const { name, data } = file;
			fileNamesToId.set(name, i++);
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
			const newSeriesShift = [...$metricsDataShift];
			seriesShift = selectedRows.forEach((r) => {
				const id: any = fileNamesToId.get(r);
				newSeriesShift[id] =  $metricsDataShift[id] + selectedRowsShift
			})
			seriesShift = newSeriesShift;
		}
	});
</script>

<div id="container_wrapper">
	{#if $metricsData.length > 0}
		{#each metricNames as metric}
			<MetricBlock
				{...{
					containerName,
					metric,
					seriesShift,
					seriesData: seriesData[metric]
				}}
				bind:selectedRows
				bind:selectedRowsShift
			/>
		{/each}
	{/if}
</div>
