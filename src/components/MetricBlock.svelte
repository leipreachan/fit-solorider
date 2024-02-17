<script lang="ts">
	import Table from './Table.svelte';
	import { _ } from 'svelte-i18n';

    export let containerName: string;
    export let metric: string;
    export let tableData: any;
    export let selectedRowHandler: any;
</script>

<span>
	<div class="chart_wrapper">
		<div id={containerName + metric} class="chart_container"></div>
		{#if tableData?.length > 0}
			<Table
				tableData={tableData}
				selectedRowHandler={metric === 'power' ? selectedRowHandler : null}
				{metric}
			/>
		{/if}
	</div>
</span>
