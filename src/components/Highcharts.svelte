<!-- src/components/Highcharts.svelte -->
<script>
	import { onMount, afterUpdate } from 'svelte';
	import { Input, Range } from 'flowbite-svelte';
	import Highcharts from 'highcharts';
	import { writable } from 'svelte/store';
	import Table from './Table.svelte';

	const sourceNameParam = 'Source';

	export let metricsData = [];
	const newSeries = new Map();
	const originalSeries = new Map();
	const minRange = -65;
	const maxRange = 65;
	let metricNames = new Set();

	let shift = writable([0, 0]);
	let moreData = writable({});
	let value = '0';
	let minutes = '0';

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
			zoomType: 'x'
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
			crosshair: true
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

	const priority = new Map([
		['power', ['watts']],
		['cadence', ['rpm']],
		['heart_rate', ['bpm']],
		['altitude', ['meters', 'area']],
		['temperature', ['degrees']]
	]);
	const exclude = new Set([
		'timestamp',
		'position_lat',
		'position_long',
		'elapsed_time',
		'timer_time'
	]);

	const initChart = (metricName) => {
		if (!charts.has(metricName)) {
			options.title.text = metricName.replace('_', ' ');
			options.yAxis.title.text = priority.get(metricName)[0];
			options.chart.type = priority.get(metricName)[1] || 'line';
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
		const fourthPowerValues = rollingAverages.map((value) => Math.pow(value, 4));

		// Step 3: Determine the average of these values
		const averageFourthPower =
			fourthPowerValues.reduce((sum, value) => sum + value, 0) / fourthPowerValues.length;

		// Step 4: Find the fourth root of the resulting average
		return Math.round(Math.pow(averageFourthPower, 1 / 4));
	};

	const calculateAverage = (data) => {
		return Math.round(data.reduce((acc, curr) => acc + curr, 0) / data.length);
	};

	const calculateMax = (data) => {
		return Math.round(Math.max(...data));
	};

	const caluclateTotalElevation = (altitudeData) => {
		let elevationGain = 0;
		let previousAltitude = altitudeData[0];

		for (let i = 1; i < altitudeData.length; i++) {
			const currentAltitude = altitudeData[i];
			const altitudeChange = currentAltitude - previousAltitude;

			if (altitudeChange > 0) {
				elevationGain += altitudeChange;
			}

			previousAltitude = currentAltitude;
		}

		return Math.round(elevationGain);
	};

	const percDiff = (a, b) => {
		return a === 0? 100: Math.round(((b - a) * 100) / a);
	};

	const addPowerData = (name, data) => {
		addAvgMaxData(name, 'power', data, {
			Average: calculateAverage,
			Normalised: calculateNormalizedPower,
			Max: calculateMax
		});
	};

	const addAltitudeData = (name, data) => {
		addAvgMaxData(name, 'altitude', data, {
			Average: calculateAverage,
			Normalised: calculateNormalizedPower,
			Max: calculateMax,
			Total: caluclateTotalElevation
		});
	};

	const addAvgMaxData = (
		sourceName,
		metricName,
		data,
		fields = {
			Average: calculateAverage,
			Max: calculateMax
		}
	) => {
		const newValues = { [sourceNameParam]: sourceName };
		const m = $moreData[metricName] || [];
		for (let [k, cb] of Object.entries(fields)) {
			const val = cb(data) || 0;
			const mName = `${k} ${metricName}`;
			let diff = 0;
			if (m.length > 0) {
				const compareWith = m[0][mName];
				diff = percDiff(compareWith.value, val);
			}
			newValues[mName] = {value: val, diff};
		}

		let current = $moreData;
		current[metricName] = [...m, newValues];
		moreData.set(current);
		console.log($moreData);
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
					addAltitudeData(s.name, rawData);
					break;
				default:
					addAvgMaxData(s.name, field, rawData);
			}
			seriesNames.add(s.name);
		});
		initChart(field).redraw();
	};

	const getMetricNames = async (data) => {
		metricNames = new Set(data.flatMap((fit) => fit.data.flatMap((x) => Object.keys(x))));

		// console.log(metricNames);
	};

	afterUpdate(() => {
		// Update chart series when data changes
		if (metricsData.length > 0) {
			const fields = [...priority.keys()];
			for (let i = 0; i < fields.length; i++) {
				const values = metricsData
					.filter((m) => !seriesNames.has(m.name))
					.map((fit) => ({
						name: fit.name,
						data: fit.data.map((x) => [Date.parse(x.timestamp), x[fields[i]] || null])
					}));
				newSeries.set(fields[i], values);
			}

			for (const [field, value] of newSeries) {
				drawChart(field, value);
			}

			getMetricNames(metricsData);
		}
	});

	function shiftChart() {
		const ms = $shift.reduce((sum, cur) => sum + cur, 0);
		for (let k of priority.keys()) {
			// console.log(k);
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

	function handleOnMinutesChange(event) {
		shift.set([event.target.value * 60 * 1000, $shift[1]]);
		shiftChart();
	}

	function handleOnRangeChange(event) {
		shift.set([$shift[0], event.target.value * 1000]);
		shiftChart();
	}
</script>

<div id="container_wrapper">
	{#each priority.keys() as key}
		<div class="chart_wrapper">
			<div id={'chartContainer_' + key}></div>
			{#if $moreData[key]?.length > 0}
				<Table tableData={$moreData[key]}/>
			{:else}
				<center>No {key} data found in one of the uploaded files</center>
			{/if}
		</div>
		{#if key === 'power' && $moreData[key]?.length > 1}
			<div class="mb-10">
				<div class="flex flex flex-col items-center mb-4">
					<div class="mb-3">
						Shift second chart by:
					</div>
					<div class="relative w-1/2 mb-6">
						<Range id="range" min="{minRange}" max="{maxRange}" bind:value on:change={handleOnRangeChange}/>
						<span class="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">{minRange}s</span>
						<span class="text-sm text-gray-500 dark:text-gray-400 absolute start-1/4 -translate-x-1/2 rtl:translate-x-1/2 -bottom-6">{Math.round(minRange/2)}s</span>
						<span class="text-sm text-gray-500 dark:text-gray-400 absolute start-2/4 -translate-x-1/2 rtl:translate-x-1/2 -bottom-6">0s</span>
						<span class="text-sm text-gray-500 dark:text-gray-400 absolute start-3/4 -translate-x-1/2 rtl:translate-x-1/2 -bottom-6">{Math.round(maxRange/2)}s</span>
						<span class="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">{maxRange}s</span>
					</div>
				</div>
				<div class="flex items-center justify-center">
					<Input type="number" class="max-w-14 p-2 border rounded mr-2" maxlength="2" value={minutes} on:change={handleOnMinutesChange} />
					<div>minutes {value} seconds</div>
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.chart_wrapper {
		@apply mb-10;
	}
</style>
