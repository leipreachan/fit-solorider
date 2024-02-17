<!-- src/components/Highcharts.svelte -->
<script lang="ts">
	import { onMount, afterUpdate, beforeUpdate } from 'svelte';
	import * as Highcharts from 'highcharts';
	import { _ } from 'svelte-i18n';
	import { timeStart, timeEnd } from '$lib/helpers/helper';
	import { theme } from '../stores/theme';
	import { metricsData, metricsDataShift } from '../stores/data';
	import Shifter from './Shifter.svelte';
	import MetricBlock from './MetricBlock.svelte';

	const sourceNameParam = 'Source';
	const containerName = 'chartContainer_';
	const selectedRows = new Set();

	let disabled = true;
	let newSeries = new Map();
	let metricNames: Set<string> = new Set();

	let syncShift = 0;
	let tableData: any = [];

	function logExtremes(event: { target: { chart: any }; userMin: number; userMax: number }) {
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
		drawTables(field, newData, true);
	}

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

	const charts = new Map();
	const chartSeriesNames = new Map();

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
			options.title.text = $_(metricName).replaceAll('_', ' ');
			options.yAxis.title.text = priority.get(metricName)?.units || '';
			options.chart.type = priority.get(metricName)?.type || 'line';
			if (series !== null) {
				options.series = series;
			}
			//@ts-ignore
			try {
				const chart = Highcharts.chart(containerName + metricName, options, () => {});
				charts.set(metricName, chart);
			} catch (e) {
				console.error(`Error while initialising chart '${containerName + metricName}'`, e, options);
			}
		}
		return charts.get(metricName);
	};

	onMount(() => {});

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
		const units = priority.get(metricName)?.shortUnits || priority.get(metricName)?.units || '';
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

	async function drawChart(field: string, value: { name: any; data: any }[]) {
		const chart = initChart(field);
		value.forEach(({ name, data }) => {
			const hash = name + field;
			if (chartSeriesNames.has(hash)) {
				const index = chartSeriesNames.get(hash);
				chart.series[index].update({ data }, false);
			} else {
				chartSeriesNames.set(hash, chart.series.length);
				chart.addSeries({ name, data }, false);
			}
		});
		// chart.redraw();
		return chart;
	}

	async function drawTables(field: string, value: any[], fullRedraw = false) {
		let newData = fullRedraw ? [] : tableData[field] || [];
		const sources = new Set(
			newData.length > 0 ? newData.map((x: { Source: { value: any } }) => x.Source.value) : []
		);
		tableData[field] = value
			.filter((x) => !sources.has(x.name))
			.reduce((accum, { name, data }) => {
				const firstRow = accum[0] || {};
				const rawData = data.map((x: any[]) => x[1]);
				const td = prepareTableData(field, name, rawData, firstRow);
				return [...accum, td];
			}, newData);
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
		const result = new Map();

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
				const curr = result.get(key) || [];
				curr.push({ name, data: metricToFileToData[key] });
				result.set(key, curr);
			}
		}
		return result;
	}

	beforeUpdate(() => {
		if ($metricsData.length > 0) {
			getMetricNames($metricsData);
		}
	});

	afterUpdate(() => {
		// Update chart series when data changes
		if ($metricsData.length > 0) {
			newSeries = getSeriesData();
			for (const [field, value] of newSeries) {
				const shiftedValue = calculateShiftedSeries(value, false);
				drawChart(field, shiftedValue);
				drawTables(field, value);
			}

			renderCharts();
		} else {
			destroyCharts();
		}
	});

	function shiftAllSeries(selectedOnly: boolean) {
		for (let k of metricNames) {
			shiftSeriesOfSingleChart(k, selectedOnly);
		}
	}

	function calculateShiftedSeries(value: any, selectedOnly: boolean) {
		let id = 0;
		const result = value.map(({ name, data }: { name: string; data: any[] }) => {
			let shift = $metricsDataShift[id];
			if (selectedOnly) {
				shift = selectedRows.has(name) ? $metricsDataShift[id] + syncShift : $metricsDataShift[id];
			}
			id++;
			return { name, data: data.map((x) => [x[0] + shift, x[1]]) };
		});
		return result;
	}

	async function shiftSeriesOfSingleChart(k: string, selectedOnly: boolean) {
		const chart = initChart(k);
		const series = calculateShiftedSeries(newSeries.get(k), selectedOnly);
		for (let id = 0; id < chart.series.length; id++) {
			chart.series[id].update({ data: series[id].data }, false);
		}
		chart.redraw();
	}

	const handleShiftChange = (shift: number) => {
		syncShift = shift;
		shiftAllSeries(true);
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

	const renderSingleChart = async (chart: {
		options: any;
		update: (arg0: any, arg1: boolean) => void;
	}) => {
		const updatedOptions = getUpdatedOptions(chart.options);
		chart.update(updatedOptions, true); // The second parameter 'true' preserves the state
	};

	const renderCharts = async () => {
		timeStart('render all charts');
		let i = 0;
		for (const chart of charts.values()) {
			timeStart(`render chart ${i}`);
			renderSingleChart(chart);
			timeEnd(`render chart ${i}`);
			i++;
		}
		timeEnd('render all charts');
	};

	function destroyCharts() {
		charts.clear();
		chartSeriesNames.clear();
		newSeries.clear();
		metricNames.clear();
		selectedRows.clear();
	}

	function getUpdatedOptions(options: any) {
		const textColor = $theme === 'dark' ? '#c5c9cf' : '#000000';
		const themeOptions = {
			chart: {
				backgroundColor: $theme === 'dark' ? '#1f2937' : '#ffffff',
				style: {
					color: $theme === 'dark' ? '#c5c9cf' : '#ffffff'
				}
				// Add more theme options as needed
			},
			legend: {
				itemStyle: {
					color: textColor
				}
			},
			title: {
				style: {
					color: textColor
				}
			},
			xAxis: {
				labels: {
					style: {
						color: textColor
					}
				}
			},
			yAxis: {
				labels: {
					style: {
						color: textColor
					}
				}
			}
		};
		return {
			...options,
			...themeOptions
		};
	}
</script>

<div id="container_wrapper">
	{#if $metricsData.length > 0}
		{#each metricNames as metric}
			<MetricBlock
				{...{
					containerName,
					metric,
					selectedRowHandler,
					handleShiftChange,
					disabled,
					tableData: tableData[metric]
				}}
			/>
			{#if metric === 'power' && tableData?.length > 1}
				<Shifter {...{ handleShiftChange, disabled }} />
			{/if}
		{/each}
	{/if}
</div>
