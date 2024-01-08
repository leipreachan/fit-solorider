<!-- src/components/Highcharts.svelte -->
<script>
	import { onMount, afterUpdate } from 'svelte';
	import Highcharts from 'highcharts';
	import { writable } from 'svelte/store';
	import Table from './Table.svelte';


	export let metricsData = [];
	let powerData = writable([]);
	let cadenceData = writable([]);
	let hrData = writable([]);
	const blueStyle = 'blueTable';

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
				text: ''
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
			options.title.text = metricName.replace('_', ' ');
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

	const calculateNormalizedPower = (dataPoints) => {
		const windowSize = 30; // Rolling 30-second window size

		// Step 1: Calculate rolling 30-second average power
		const rollingAverages = [];
		for (let i = 0; i <= dataPoints.length - windowSize; i++) {
			const window = dataPoints.slice(i, i + windowSize);
			const averagePower = window.reduce((sum, value) => sum + value, 0) / windowSize;
			rollingAverages.push(averagePower);
		}

		// Step 2: Raise the resulting values to the fourth power
		const fourthPowerValues = rollingAverages.map(value => Math.pow(value, 4));

		// Step 3: Determine the average of these values
		const averageFourthPower = fourthPowerValues.reduce((sum, value) => sum + value, 0) / fourthPowerValues.length;

		// Step 4: Find the fourth root of the resulting average
		return Math.round(Math.pow(averageFourthPower, 1 / 4));
	};

	const calculateAverage = (data) => {
		return Math.round(data.reduce((acc, curr) => acc + curr, 0) / data.length);
	};

	const displayPower = (name, data) => {
		powerData.set(
			[...$powerData, {
				'Source': name,
				'Average Power': calculateAverage(data),
				'Normalised Power': calculateNormalizedPower(data),
				'Max Power': Math.max(...data)
			}]
		);
	};

	const displayCadence = (name, data) => {
		cadenceData.set(
			[...$cadenceData, {
				'Source': name,
				'Average Cadence': calculateAverage(data),
				'Max Cadence': Math.max(...data)
			}]
		);
	};

	const displayHr = (name, data) => {
		hrData.set(
			[...$hrData, {
				'Source': name,
				'Average HR': calculateAverage(data),
				'Max HR': Math.max(...data)
			}]
		);
	};

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
					const rawData = s.data.map((x) => x[1]);
					switch (field) {
						case 'power':
							displayPower(s.name, rawData);
							break;
						case 'cadence':
							displayCadence(s.name, rawData);
							break;
						case 'heart_rate':
							displayHr(s.name, rawData);
							break;
					}
					seriesNames.add(s.name);
				});
				initChart(field).redraw();
			}
		}
	});

</script>

<style>
    .chart_wrapper {
				margin-bottom: 3em;
		}
</style>

<div id="container_wrapper">
	<div class="chart_wrapper">
		<div id="chartContainer_power"></div>
		{#if $powerData.length > 0}
			<Table tableData={$powerData} style={blueStyle} />
		{/if}
	</div>
	<div class="chart_wrapper">
		<div id="chartContainer_cadence"></div>
		{#if $cadenceData.length > 0}
			<Table tableData={$cadenceData} style={blueStyle} />
		{/if}
	</div>
	<div class="chart_wrapper">
		<div id="chartContainer_heart_rate"></div>
		{#if $hrData.length > 0}
			<Table tableData={$hrData} style={blueStyle} />
		{/if}
	</div>
</div>
