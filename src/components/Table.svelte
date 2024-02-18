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
	import { _ } from 'svelte-i18n';

	export let tableData: any[] = [];
	export let selectedRowHandler: any = null;
	export let metric: string = '';
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
				<TableHeadCell class={i === 0 && showCheckbox ? 'px-0' : 'px-6'}>
					{$_(columnHeading.toLowerCase())}
					{i === 0 ? '' : $_(metric).replaceAll('_', ' ')}
				</TableHeadCell>
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
								{cell.value === null ? '-' : cell.value + cell.units}
								<CellBadge diff={cell.diff} />
							</Label>
						</TableBodyCell>
					{/each}
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>

<style lang="postcss">
	.table-wrapper {
		@apply flex justify-center;
	}
</style>
