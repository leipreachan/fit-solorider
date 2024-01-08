<!-- src/components/Highcharts.svelte -->
<script>
	import { onMount, afterUpdate } from 'svelte';
	import Highcharts from 'highcharts';
	import { writable } from 'svelte/store';
	import Table from './Table.svelte';

	const sourceName = 'Source';

	export let metricsData = [];
	const newSeries = new Map();
	const originalSeries = new Map();
	let metricNames = new Set();

	let powerData = writable([]);
	let moreData = writable({});
	let value = '0';
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

	const priority = new Map([['power', 'watts'], ['cadence', 'rpm'], ['heart_rate', 'bpm'], ['altitude', 'meters']]);
	const exclude = new Set(['timestamp', 'position_lat', 'position_long', 'elapsed_time', 'timer_time']);

	const initChart = (metricName) => {
		if (!charts.has(metricName)) {
			options.title.text = metricName.replace('_', ' ');
			options.yAxis.title.text = priority.get(metricName);
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

	const percDiff = (a, b) => {
		return ' Δ' + Math.round((b - a) * 100 / a) + '%';
	};

	const addPowerData = (name, data) => {
		let avg = calculateAverage(data);
		let norm = calculateNormalizedPower(data);
		let max = Math.max(...data);
		const avgName = 'Average Power';
		const normName = 'Normalised Power';
		const maxName = 'Max Power';

		if ($powerData.length > 0) {
			avg = avg + percDiff($powerData[0][avgName], avg);
			norm = norm + percDiff($powerData[0][normName], norm);
			max = max + percDiff($powerData[0][maxName], max);
		}

		powerData.set(
			[...$powerData, {
				[sourceName]: name,
				[avgName]: avg,
				[normName]: norm,
				[maxName]: max
			}]
		);
	};

	const addAvgMaxData = (sourceName, metricName, data) => {
		let avg = calculateAverage(data);
		let max = Math.round(Math.max(...data));
		const avgName = `Average ${metricName}`;
		const maxName = `Max ${metricName}`;
		if (metricName in $moreData && $moreData[metricName].length > 0) {
			avg = avg + percDiff($moreData[metricName][0][avgName], avg);
			max = max + percDiff($moreData[metricName][0][maxName], max);
		}

		let current = $moreData;
		if (!(metricName in current)) {
			current[metricName] = [];
		}
		current[metricName] = [...($moreData[metricName] || []), {
			[sourceName]: sourceName,
			[avgName]: avg,
			[maxName]: max,
		}];
		moreData.set(current);
	};

	const drawChart = async (field, value) => {
		value.forEach((s) => {
			initChart(field).addSeries({ name: s.name, data: s.data }, false);
			const rawData = s.data.map((x) => x[1]);
			switch (field) {
				case 'power':
					addPowerData(s.name, rawData);
					break;
				case 'cadence':
					addAvgMaxData(s.name, 'cadence', rawData);
					break;
				case 'heart_rate':
					addAvgMaxData(s.name, 'heart_rate', rawData);
					break;
				case 'altitude':
					addAvgMaxData(s.name, 'altitude', rawData);
					break;
			}
			seriesNames.add(s.name);
		});
		initChart(field).redraw();
	};

	const getMetricNames = async (data) => {
		metricNames = new Set(
			data.flatMap((fit) => fit.data.flatMap((x) => Object.keys(x)))
		);

		// console.log(metricNames);
	};

	afterUpdate(() => {
		// Update chart series when data changes
		if (metricsData.length > 0) {

			const fields = [...priority.keys()];
			for (let i = 0; i < fields.length; i++) {
				const values = metricsData.filter((m) => !seriesNames.has(m.name)).map(
					(fit) =>
						({ name: fit.name, data: fit.data.map((x) => [Date.parse(x.timestamp), x[fields[i]] || null]) }));
				newSeries.set(fields[i], values);
			}

			for (const [field, value] of newSeries) {
				drawChart(field, value);
			}

			getMetricNames(metricsData);
		}
	});

	function handleOnRangeChange(event) {
		const ms = event.target.value * 1000;
		for (let k of priority.keys()) {
			console.log(k);
			const chrt = initChart(k);
			if (originalSeries.get(k) === undefined) {
				originalSeries.set(k, [...chrt.options.series[1].data]);
			}
			let data = [...originalSeries.get(k)];
			data = data.map((x) => [x[0] + ms, x[1]]);
			chrt.series[1].setData(data);
			chrt.redraw(true);
		}
	}

</script>

<style>
    .chart_wrapper {
        margin-bottom: 3em;
    }

    .range {
        font-family: Helvetica, serif;
        text-align: center;
    }

    .range [type=range] {
        width: 800px;
    }

</style>

<div id="container_wrapper">
	<div class="chart_wrapper">
		<div id="chartContainer_power"></div>
		{#if $powerData.length > 0}
			<Table tableData={$powerData} style={blueStyle} />
		{/if}
		{#if $powerData.length > 1}
			<div class="range">
				Shift second chart by:<br>
				<input type="range" min="-120" max="120" bind:value on:change={handleOnRangeChange}><br>{value}
				seconds
			</div>
		{/if}
	</div>
	<div class="chart_wrapper">
		<div id="chartContainer_cadence"></div>
		{#if $moreData['cadence']?.length > 0}
			<Table tableData={$moreData['cadence']} style={blueStyle} />
		{/if}
	</div>
	<div class="chart_wrapper">
		<div id="chartContainer_heart_rate"></div>
		{#if $moreData['heart_rate']?.length > 0}
			<Table tableData={$moreData['heart_rate']} style={blueStyle} />
		{/if}
	</div>
	<div class="chart_wrapper">
		<div id="chartContainer_altitude"></div>
		{#if $moreData['altitude']?.length > 0}
			<Table tableData={$moreData['altitude']} style={blueStyle} />
		{/if}
	</div>
</div>
