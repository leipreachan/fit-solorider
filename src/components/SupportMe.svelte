<script>
	function initializeKofi() {
		kofiWidgetOverlay.draw('solorider', {
			type: 'floating-chat',
			'floating-chat.donateButton.text': 'Tip Me',
			'floating-chat.donateButton.background-color': '#f45d22',
			'floating-chat.donateButton.text-color': '#fff'
		});
	}
</script>

<svelte:head>
	<script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js" on:load={initializeKofi}></script>
</svelte:head>