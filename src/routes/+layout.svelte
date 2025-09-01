<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="border-b border-slate-200 mb-4 bg-[#6E001F]">
	<nav class="flex gap-6 py-4 container mx-auto text-white">
		<a class="text-white font-semibold hover:underline" href="/">Dashboard</a>
		<a class="text-white font-semibold hover:underline" href="/expenses">Expenses</a>
		<a class="text-white font-semibold hover:underline" href="/budgets">Budgets</a>
		<a class="text-white font-semibold hover:underline" href="/reports">Reports</a>
	</nav>
</header>

<main class="py-6 container mx-auto">
	{@render children?.()}
</main>
