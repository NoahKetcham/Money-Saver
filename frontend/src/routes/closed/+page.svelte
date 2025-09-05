<script lang="ts">
    import { closedAccounts, loadClosedAccounts } from '$lib/stores/accounts';
    import { onMount } from 'svelte';

    onMount(() => {
        loadClosedAccounts();
    });

    function reopen(id: string) {
        // Future enhancement: allow reopen; for now do nothing
    }
</script>

<h1 class="text-2xl font-semibold mb-4">Closed Accounts</h1>

{#if $closedAccounts.length === 0}
    <p>No closed accounts.</p>
{:else}
    <table class="w-full border border-slate-200">
        <thead class="bg-slate-100 text-left">
            <tr>
                <th class="p-2">Name</th>
                <th class="p-2">Type</th>
                <th class="p-2 text-right">Balance</th>
            </tr>
        </thead>
        <tbody>
            {#each $closedAccounts as acc}
                <tr class="border-t">
                    <td class="p-2">{acc.name}</td>
                    <td class="p-2">{acc.type}</td>
                    <td class="p-2 text-right">${acc.balance.toFixed(2)}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}
