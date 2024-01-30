<script lang="ts">
	import { Input, Range } from 'flowbite-svelte';
	import { _ } from 'svelte-i18n';

	export let minRange: number;
	export let maxRange: number;
	export let handleShiftChange: any;
	export let disabled: boolean;

	let seconds = 0;
	let minutes = 0;

	function handleChange() {
		const shift = (parseInt(seconds) + parseInt(minutes) * 60) * 1000;
		handleShiftChange(shift);
	}

	const rangeTicks = [
		{ value: minRange, style: 'start-0' },
		{ value: Math.round(minRange / 2), style: 'start-1/4 -translate-x-1/2 rtl:translate-x-1/2' },
		{ value: 0, style: 'start-2/4 -translate-x-1/2 rtl:translate-x-1/2' },
		{ value: Math.round(maxRange / 2), style: 'start-3/4 -translate-x-1/2 rtl:translate-x-1/2' },
		{ value: maxRange, style: 'end-0' }
	];
</script>

<div class="my-5">
	<div class="mb-4 flex flex-col items-center">
		<div class="mb-3">
			{disabled ? $_('select_file') : $_('select_file')}
		</div>
		<div class="relative mb-6 w-1/2">
			<Range
				id="range"
				min={minRange}
				max={maxRange}
				bind:value={seconds}
				on:change={handleChange}
				{disabled}
			/>
			{#each rangeTicks as tick}
				<span class="tick {tick.style}">
					{tick.value}{$_('s_seconds')}
				</span>
			{/each}
		</div>
	</div>
	<div class="flex items-center justify-center">
		<Input
			id="minutes_shift"
			type="number"
			class="mr-2 max-w-14"
			maxlength="2"
			bind:value={minutes}
			on:change={handleChange}
			{disabled}
		/>
		<label for="minutes_shift">{$_('minutes')}</label>
		<Input
			id="seconds_shift"
			type="number"
			class="ml-4 mr-2 max-w-16"
			maxlength="3"
			bind:value={seconds}
			on:change={handleChange}
			{disabled}
		/>
		<label for="seconds_shift">{$_('seconds')}</label>
	</div>
</div>

<style>
	.tick {
		@apply absolute -bottom-6 text-sm text-gray-500 dark:text-gray-400;
	}
</style>
