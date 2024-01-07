<!-- src/components/Highcharts.svelte -->
<script>
	import { onMount, afterUpdate } from 'svelte';
	import Highcharts from 'highcharts';

	export let metricsData = [];

	const options = {
		title: {
			text: ''
		},
		chart: {
			zoomType: 'x'
		},
		xAxis: {
			type: 'datetime'
		},
		yAxis: {
			title: {
				text: ""
			}
		}
		// Add additional Highcharts configuration options as needed
	};

	let charts = new Map();
	let seriesNames = new Set();

	const priority = new Map([['power', 'watts'], ['cadence', 'rpm'], ['heart_rate', 'bpm']]);
	const exclude = new Set(['timestamp', 'position_lat', 'position_long', 'elapsed_time', 'timer_time']);

	const initChart = (metricName) => {
		if (!charts.has(metricName)) {
			options.title.text = metricName;
			options.yAxis.title.text = priority.get(metricName);
			console.log(metricName);
			charts.set(metricName, Highcharts.chart(`chartContainer_${metricName}`, options));
		}
		return charts.get(metricName);
	};

	onMount(() => {
		// Initialize Highcharts chart on mount
		if ([...charts].length === 0) {
			initChart('power');
		}
	});

	afterUpdate(() => {
		// Update chart series when data changes
		if (metricsData.length > 0) {

			const newSeries = new Map();
			const fields = [...priority.keys()];
			for (let i = 0; i < fields.length; i++) {
				const series = metricsData.filter((m) => !seriesNames.has(m.name)).map(
					(fit) =>
						({ name: fit.name, data: fit.data.map((x) => [Date.parse(x.timestamp), x[fields[i]] || null]) }));
					newSeries.set(fields[i], series);
			}

			for (const [field, value] of newSeries) {
				value.forEach((s) => {
					initChart(field).addSeries({ name: s.name, data: s.data }, false);
					seriesNames.add(s.name);
				});
				initChart(field).redraw();
			}
		}
	});

</script>

<style>
    /* Add your styles here */
</style>

<div id="container_wrapper">
	<div id="chartContainer_power"></div>
	<div id="chartContainer_cadence"></div>
	<div id="chartContainer_heart_rate"></div>
</div>
