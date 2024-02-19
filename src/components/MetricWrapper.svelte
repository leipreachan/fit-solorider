<script lang="ts">
	import Shifter from './Shifter.svelte';
	import { _ } from 'svelte-i18n';
	import * as Highcharts from 'highcharts';
	import { afterUpdate, beforeUpdate, onMount } from 'svelte';
	import TableWrapper from './TableWrapper.svelte';
	import { metricsDataShift } from '$lib/stores/data';

	export let containerName: string;
	export let metric: string;
	export let syncShift: any;
	export let seriesData: any;

	const metricOptions = new Map([
		['power', { units: ' ' + $_('watts') }],
		['cadence', { units: ' ' + $_('rpm') }],
		['heart_rate', { units: ' ' + $_('bpm') }],
		['altitude', { units: $_('meters'), shortUnits: $_('m_meters'), type: 'area' }],
		['temperature', { units: $_('degrees'), shortUnits: '°' }]
	]);

	let disabled = true;

	let selectedRows = new Set();
	const chartSeries = new Map();
	let currentChart: any;

	const logExtremes = (event: { target: { chart: any }; userMin: number; userMax: number }) => {
		const chart = event?.target.chart;
		const field = chart.container.parentNode.id.replace(containerName, '');
		let newData = [];
		if (event.userMin && event.userMax) {
			newData = chart.series.map((s: { data: any[] }, k: string | number) => ({
				name: chart.series[k].name,
				data: s.data
					.filter((v) => v.x >= event.userMin && v.x <= event.userMax)
					.map(({ x, y }) => [x, y])
			}));
		} else {
			newData = chart.series.map((s: { data: { x: any; y: any }[] }, k: string | number) => ({
				name: chart.series[k].name,
				data: s.data.map(({ x, y }) => [x, y])
			}));
		}
		// drawTables(field, newData, true);
	};

	function optionsFormatter() {
		return (
			'<b>' +
			Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +
			'</b><br/>' +
			this.points.reduce(
				(str: string, point: { series: { color: string; name: string }; y: number }) => {
					return (
						str +
						'<span style="color:' +
						point.series.color +
						'">\u25CF</span> ' +
						point.series.name +
						': <b>' +
						Math.round(point.y) +
						'</b><br/>'
					);
				},
				''
			)
		);
	}

	const options: any = {
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
			formatter: optionsFormatter,
			shared: true // Enable shared tooltip
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

	const getDefaultOptions = (metricName: string) => {
		options.title.text = $_(metricName).replaceAll('_', ' ');
		options.yAxis.title.text = metricOptions.get(metricName)?.units || '';
		options.chart.type = metricOptions.get(metricName)?.type || 'line';
		return options;
	};

	const initChart = (metricName: string, defaultOptions: any, defaultSeries: any = {}) => {
		let result = null;
		try {
			result = Highcharts.chart(containerName + metricName, defaultOptions, () => {});
		} catch (e) {
			console.error(
				`Error while initialising chart '${containerName + metricName}'`,
				e,
				defaultOptions
			);
		}
		return result;
	};

	const updateSingleSeries = async (chart: any, name: string, data: any) => {
		if (chartSeries.has(name)) {
			const index = chartSeries.get(name);
			chart.series[index].update({ data }, false);
		} else {
			chartSeries.set(name, chart.series.length);
			chart.addSeries({ name, data }, false);
		}
	};

	const updateChartSeries = async (chart: any, value: { name: any; data: any }[]) => {
		if (!value) {
			return;
		}
		value.forEach(({ name, data }) => updateSingleSeries(chart, name, data));
		chart.redraw();
	};

	function calculateShiftedSeries(data: any) {
		let id = 0;
		return data.map(({ name, data }: { name: string; data: any[] }) => {
			let shift = $metricsDataShift[id];
			// if (selectedOnly) {
			// shift = selectedRows.has(name) ? $metricsDataShift[id] + syncShift : $metricsDataShift[id];
			// }
			id++;
			return { name, data: data.map((x) => [x[0] + shift, x[1]]) };
		});
	}

	onMount(() => {
		currentChart = initChart(metric, getDefaultOptions(metric));
	});

	afterUpdate(() => {
		if (seriesData) {
			seriesData = calculateShiftedSeries(seriesData);
			updateChartSeries(currentChart, seriesData);
		}
		syncShift = 0;
	});
</script>

<span>
	<div class="chart_wrapper">
		<div id={containerName + metric} class="chart_container"></div>
		<TableWrapper {...{ metric, seriesData }} bind:selectedRows />
	</div>
	{#if metric === 'power' && chartSeries.get('power')?.length > 1}
		<Shifter bind:value={syncShift} {disabled} />
	{/if}
</span>
