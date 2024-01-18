<script>
    import { Input, Range } from 'flowbite-svelte';

    /**
	 * @type {number}
	 */
     export let minRange;
	/**
	 * @type {number}
	 */
	 export let maxRange;
    /**
	 * @type {((e: Event) => void) | null | undefined}
	 */
     export let handleOnRangeChange;
    /**
	 * @type {((e: Event) => void) | null | undefined}
	 */
     export let handleOnMinutesChange;

    let seconds = 0;
	let minutes = '0';

	const rangeTicks = [
		{ value: minRange, style: 'start-0' },
		{ value: Math.round(minRange / 2), style: 'start-1/4 -translate-x-1/2 rtl:translate-x-1/2' },
		{ value: 0, style: 'start-2/4 -translate-x-1/2 rtl:translate-x-1/2' },
		{ value: Math.round(maxRange / 2), style: 'start-3/4 -translate-x-1/2 rtl:translate-x-1/2' },
		{ value: maxRange, style: 'end-0' }
	];
</script>

<div class="mb-10">
    <div class="flex flex flex-col items-center mb-4">
        <div class="mb-3">Shift second chart by:</div>
        <div class="relative w-1/2 mb-6">
            <Range
                id="range"
                min={minRange}
                max={maxRange}
                bind:value={seconds}
                on:change={handleOnRangeChange}
            />
            {#each rangeTicks as tick}
                <span class="tick {tick.style}">
                    {tick.value}s
                </span>
            {/each}
        </div>
    </div>
    <div class="flex items-center justify-center">
            <Input
            id="minutes_shift"
            type="number"
            class="max-w-14 mr-2"
            maxlength="2"
            bind:value={minutes}
            on:change={handleOnMinutesChange}
        />
        <label for="minutes_shift">minutes</label>
            <Input
            id="seconds_shift"
            type="number"
            class="max-w-16 mr-2 ml-4"
            maxlength="3"
            bind:value={seconds}
            on:change={handleOnRangeChange}
        /> 
        <label for="seconds_shift">seconds</label>
    </div>
</div>

<style>
	.tick {
		@apply text-sm text-gray-500 dark:text-gray-400 absolute -bottom-6;
	}
</style>