<script>
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Badge,
		Checkbox,
		TableSearch
	} from 'flowbite-svelte';

	export let tableData = [];
	export let style;
</script>

<div class="table-wrapper">
	<Table hoverable={true}>
		<TableHead>
			{#each Object.keys(tableData[0]) as columnHeading}
				<TableHeadCell>{columnHeading}</TableHeadCell>
			{/each}
		</TableHead>
		<TableBody>
			{#each Object.values(tableData) as row}
				<TableBodyRow>
					{#each Object.values(row) as cell}
						<TableBodyCell>
							{cell.value === null ? '-' : (cell.value + cell.units)}
							{#if cell.diff != 0}
								<Badge color={cell['diff'] > 0 ? 'red' : 'blue'}>{cell.diff}%</Badge>
							{/if}
						</TableBodyCell>
					{/each}
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>

<style>
	.table-wrapper {
		@apply flex justify-center;
	}

	table {
		@apply w-3/4 border-collapse;
	}
</style>
