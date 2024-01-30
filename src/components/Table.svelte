<script lang="ts">
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Checkbox,
		Label
	} from 'flowbite-svelte';
	import CellBadge from './CellBadge.svelte';

	export let tableData: any[] = [];
	export let selectedRowHandler: any = null;
	$: showLabel = typeof selectedRowHandler === 'function';
	$: showCheckbox = showLabel && tableData.length > 1;
</script>

<div class="table-wrapper">
	<Table hoverable={true}>
		<TableHead>
			{#if showCheckbox}
				<TableHeadCell class="px-4" />
			{/if}
			{#each Object.keys(tableData[0]) as columnHeading, i}
				<TableHeadCell class={i === 0 && showCheckbox ? 'px-0' : 'px-6'}>{columnHeading}</TableHeadCell>
			{/each}
		</TableHead>
		<TableBody>
			{#each Object.values(tableData) as row}
				<TableBodyRow>
					{#if showCheckbox}
						<TableBodyCell class="px-4">
							<Checkbox
								id={row.Source.value}
								value={row.Source.value}
								on:change={selectedRowHandler}
							/>
						</TableBodyCell>
					{/if}
					{#each Object.values(row) as cell, i}
						<TableBodyCell class={i === 0 && showCheckbox ? 'px-0' : 'px-6'}>
							<Label
								class={showLabel ? 'cursor-pointer' : null}
								for={showLabel ? row.Source.value : null}
							>
								<CellBadge {...cell} />
							</Label>
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
</style>
