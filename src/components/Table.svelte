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
		Label
	} from 'flowbite-svelte';

	/**
	 * @type {{ [s: number]: any; } | ArrayLike<number>}
	 */
	export let tableData = [];

	/**
	 * @type {function|null}
	 */
	export let selectedRowHandler = null;
	let showLabel = typeof selectedRowHandler === 'function';
</script>

<div class="table-wrapper">
	<Table hoverable={true}>
		<TableHead>
			{#if showLabel}
				<TableHeadCell class="p-2" />
			{/if}
			{#each Object.keys(tableData[0]) as columnHeading, i}
				<TableHeadCell class={i === 0 && typeof selectedRowHandler === 'function' ? 'px-0' : 'px-6'}
					>{columnHeading}</TableHeadCell
				>
			{/each}
		</TableHead>
		<TableBody>
			{#each Object.values(tableData) as row}
				<TableBodyRow>
					{#if typeof selectedRowHandler === 'function'}
						<TableBodyCell class="m-2 p-2">
							<Checkbox
								id={row.Source.value}
								value={row.Source.value}
								on:change={selectedRowHandler}
							/>
						</TableBodyCell>
					{/if}
					{#each Object.values(row) as cell, i}
						<TableBodyCell
							class={i === 0 && typeof selectedRowHandler === 'function' ? 'px-0' : 'px-6'}
						>
							<Label
								class={showLabel ? 'cursor-pointer' : null}
								for={showLabel ? row.Source.value : null}
							>
								{cell.value === null ? '-' : cell.value + cell.units}
								{#if cell.diff != 0}
									<Badge
										color={cell['diff'] > 0 ? 'red' : 'blue'}
										title={'compared to the first row'}>{cell.diff}%</Badge
									>
								{/if}
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
