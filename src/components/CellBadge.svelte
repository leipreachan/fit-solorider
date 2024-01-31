<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	export let diff: number;
</script>

{#if diff != 0}
	<Badge color={diff > 0 ? 'red' : 'blue'} title={'compared to the first row'}>{diff}%</Badge>
{/if}
