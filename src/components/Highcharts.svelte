<!-- src/components/Highcharts.svelte -->
<script>
	import { onMount, afterUpdate } from 'svelte';
	import Highcharts from 'highcharts';

	export let metricsData = [];

	let chart = null;

	onMount(() => {
		const options = {
			title: {
				text: 'FIT File Metrics'
			},
			chart: {
				zoomType: 'x'
			},
			xAxis: {
				type: 'datetime'
			}
			// Add additional Highcharts configuration options as needed
		};
		// Initialize Highcharts chart on mount
		if (chart === null) {
			chart = Highcharts.chart('chartContainer', options);
		}
	});

	afterUpdate(() => {
		// Update chart series when data changes
		if (chart && metricsData.length > 0) {
			const series = metricsData.map(
				(fit) =>
					({ name: fit.name, data: fit.data.map((x) => [Date.parse(x.timestamp), x.power || null]) }));

			series.forEach((s) => chart.addSeries({ name: s.name, data: s.data }, false));
			chart.redraw();
		}
	});

</script>

<style>
    /* Add your styles here */
</style>

<div id="chartContainer"></div>
