<script>
	export let tableData = [];
	export let style;
</script>

<div class="tableWraper">
<table class={style}>
	<thead>
	<tr>
		{#each Object.keys(tableData[0]) as columnHeading}
			<th>{columnHeading}</th>
		{/each}
	<tr/>
	</thead>
	<tbody>
	{#each Object.values(tableData) as row}
		<tr>
			{#each Object.values(row) as cell}
				<td>{cell}</td>
			{/each}
		</tr>
	{/each}
	</tbody>
</table>
</div>

<style>
    table, th, td {
        border: 1px solid;
        border-collapse: collapse;
        margin-bottom: 10px;
        font-family: Helvetica,serif;
    }

    tbody tr td:first-child {
        width: 25em;
        max-width: 30em;
        word-break: break-all;
    }

    table.blueTable {
        margin: 0 auto;
        border: 1px solid #a3c1d5;
        background-color: #EEEEEE;
        border-collapse: collapse;
        text-align: center;
    }
    table.blueTable td, table.blueTable th {
        border: 1px solid #AAAAAA;
        padding: 3px 2px;
    }
    table.blueTable tbody td {
        font-size: 13px;
    }
    table.blueTable tr:nth-child(even) {
        background: #D0E4F5;
    }
    table.blueTable thead {
        background: #a3c1d5;
        border-bottom: 2px solid #c0c0c0;
    }
    table.blueTable thead th {
        font-size: 15px;
        font-weight: bold;
        color: #FFFFFF;
        border-left: 2px solid #D0E4F5;
    }
    table.blueTable thead th:first-child {
        border-left: none;
    }
</style>
