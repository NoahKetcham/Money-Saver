<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { loadAccounts } from '$lib/stores/accounts';
	import { loadTransactions } from '$lib/stores/transactions';
	import { auth, logout, fetchCurrentUser } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { notifications } from '$lib/stores/notifications';

	let { children } = $props();

	let unsub: (() => void) | null = null;
	onMount(async () => {
		await fetchCurrentUser();
		unsub = auth.subscribe((v) => {
			if (v.token) {
				loadAccounts();
				loadTransactions();
			}
		});
	});

	onDestroy(() => {
		if (unsub) unsub();
	});

	$effect(() => {
		const token = $auth.token;
		const path = $page.url.pathname;
		if (!token && path !== '/login') {
			goto('/login');
		} else if (token && path === '/login') {
			goto('/');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="border-b border-slate-200 mb-4 bg-[#6E001F]">
	<nav class="flex gap-6 py-4 container mx-auto text-white items-center justify-between">
		{#if $auth.user}
			<div class="flex gap-6">
				<a class="text-white font-semibold hover:underline" href="/">Dashboard</a>
				<a class="text-white font-semibold hover:underline" href="/expenses">Expenses</a>
				<a class="text-white font-semibold hover:underline" href="/budgets">Budgets</a>
				<a class="text-white font-semibold hover:underline" href="/reports">Reports</a>
			</div>
			<div class="flex items-center gap-4">
				<span class="text-sm">Hello, {$auth.user.first_name}</span>
				<button class="text-white underline text-sm" on:click={logout}>Log out</button>
			</div>
		{:else}
			<a class="text-white underline text-sm ml-auto" href="/login">Log in</a>
		{/if}
	</nav>
</header>

<main class="py-6 container mx-auto">
	{@render children?.()}
</main>

<!-- Notifications -->
<div class="fixed top-4 right-4 space-y-2 z-50">
    {#each $notifications as n (n.id)}
        <div class="px-4 py-2 rounded shadow-lg text-white"
            class:bg-red-600={n.type==='error'}
            class:bg-green-600={n.type==='success'}
            class:bg-slate-700={n.type==='info'}>{n.message}</div>
    {/each}
</div>

<script lang="ts" context="module">
    // route guard reactive statement inside module script not allowed; instead keep in main script using $effect
</script>
