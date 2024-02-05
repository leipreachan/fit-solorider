<!-- src/routes/+page.svelte -->
<script lang="ts">
	import MyMeta from '../components/MyMeta.svelte';
	import Highcharts from '../components/Highcharts.svelte';
	import Tracker from '../components/Tracker.svelte';
	import SupportMe from '../components/SupportMe.svelte';
	import Topbar from '../components/Topbar.svelte';
	import DarkMode from '../components/DarkMode.svelte';
	import { _ } from 'svelte-i18n';
</script>

<MyMeta titleTemplate={$_('page_title')} description={$_('description')} />
<svelte:head>
	<title>{$_('page_title')}</title>
	<Tracker />
</svelte:head>

<main class="w-screen">
	<Topbar description={$_('description')}/>
	<DarkMode/>
	<SupportMe />
	<Highcharts/>
</main>
