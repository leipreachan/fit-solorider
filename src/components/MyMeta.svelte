<script lang="ts">
    import { MetaTags } from 'svelte-meta-tags';
    import type { MetaTagsProps } from 'svelte-meta-tags/MetaTags.svelte';

    export let titleTemplate = '';
    export let description = '';
    const hostAddr = 'fit.solorider.cc';

    $: metaTags = {
		titleTemplate, // Default title template.
		description, // Default description.
		openGraph: {
			siteName: hostAddr,
			images: [
				{
					url: `https://${hostAddr}/og-image.webp`,
					width: 800,
					height: 600,
					alt: 'Og Image Alt'
				}
			]
		},
		twitter: {
			site: '@site',
			cardType: 'summary_large_image',
			image: `https://${hostAddr}/og-image.webp`,
			imageAlt: 'Twitter image alt'
		}
	} as MetaTagsProps;
</script>

<MetaTags {...metaTags} />