<script lang="ts">
	import Shifter from './Shifter.svelte';
	import Table from './Table.svelte';
	import { _ } from 'svelte-i18n';
	import * as Highcharts from 'highcharts';
	import { afterUpdate, beforeUpdate, onMount } from 'svelte';

	export let containerName: string;
	export let metric: string;
	export let syncShift: any;
	export let seriesData: any;

	let tableData: any;
	let disabled = true;

	const sourceNameParam = 'Source';
	const selectedRows = new Set();
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

	const metricOptions = new Map([
		['power', { units: ' ' + $_('watts') }],
		['cadence', { units: ' ' + $_('rpm') }],
		['heart_rate', { units: ' ' + $_('bpm') }],
		['altitude', { units: $_('meters'), shortUnits: $_('m_meters'), type: 'area' }],
		['temperature', { units: $_('degrees'), shortUnits: '°' }]
	]);

	const getDefaultOptions = (metricName: string) => {
		options.title.text = $_(metricName).replaceAll('_', ' ');
		options.yAxis.title.text = metricOptions.get(metricName)?.units || '';
		options.chart.type = metricOptions.get(metricName)?.type || 'line';
		return options;
	};

	const selectedRowHandler = (event: Event | null | undefined) => {
		const target = (event?.target as HTMLSelectElement).value || null;
		if (selectedRows.has(target)) {
			selectedRows.delete(target);
		} else {
			selectedRows.add(target);
		}
		disabled = selectedRows.size === 0;
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
		console.log(`start updating ${metric} ${name}`);
		if (chartSeries.has(name)) {
			const index = chartSeries.get(name);
			chart.series[index].update({ data }, false);
		} else {
			chartSeries.set(name, chart.series.length);
			chart.addSeries({ name, data }, false);
		}
		console.log(`end updating ${name}`);
	};

	const updateChartSeries = async (chart: any, value: { name: any; data: any }[]) => {
		if (!value) {
			return;
		}
		value.forEach(({ name, data }) => updateSingleSeries(chart, name, data));
		chart.redraw();
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

	onMount(() => {
		currentChart = initChart(metric, getDefaultOptions(metric));
	})

	afterUpdate(() => {
		console.log(`after update ${metric}`)
		if (seriesData) {
			updateChartSeries(currentChart, seriesData);
			updateTableData(metric, seriesData);
		}
		syncShift = 0;
	});
</script>

<span>
	<div class="chart_wrapper">
		<div id={containerName + metric} class="chart_container"></div>
		{#if tableData?.length > 0}
			<Table
				{tableData}
				selectedRowHandler={metric === 'power' ? selectedRowHandler : null}
				{metric}
			/>
		{/if}
	</div>
	<!-- {#if metric === 'power' && tableData?.length > 1}
		<Shifter bind:value {disabled} />
	{/if} -->
</span>
