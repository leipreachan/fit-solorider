<script lang="ts">
	import '../app.pcss';
	import { setup } from '$lib/helpers/locales';
	
	const setupResult = setup();
</script>

{#await setupResult}
	<p>Loading...</p>
{:then}
	<slot />
{/await}
