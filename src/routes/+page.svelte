<script lang="ts">
    import { accounts, totalAccountBalance } from '$lib/stores/accounts';
    import { transactions, addWithdrawal, addDeposit, addTransfer } from '$lib/stores/transactions';

    function formatCurrency(value: number): string {
        return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    }

    // Recent transactions are rendered inline in the template

    // quick transaction form state
    let txType: 'deposit' | 'withdrawal' | 'transfer' = 'withdrawal';
    let amountStr = '';
    let accountId = '';
    let toAccountId = '';

    function submitQuickAdd() {
        const amount = parseFloat(amountStr);
        const from = $accounts.find((a) => a.id === accountId);
        const to = $accounts.find((a) => a.id === toAccountId);
        if (Number.isNaN(amount) || amount <= 0) return;

        if (txType === 'withdrawal') {
            if (!from) return;
            addWithdrawal({ accountId: from.id, amount, description: 'Withdrawal' });
        } else if (txType === 'deposit') {
            if (!from) return;
            addDeposit({ accountId: from.id, amount, description: 'Deposit' });
        } else {
            if (!from || !to || from.id === to.id) return;
            addTransfer({ fromAccountId: from.id, toAccountId: to.id, amount, description: 'Transfer' });
        }

        amountStr = '';
        accountId = '';
        toAccountId = '';
        txType = 'withdrawal';
    }
</script>

<div class="space-y-6">
    <h1 class="title-xl">Accounts</h1>

    <section class="card">
        <header class="card-header section-accent flex items-center justify-between">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-700">Your accounts</h2>
            <p class="text-sm text-slate-600">Total: <span class="font-semibold brand-text">{formatCurrency($totalAccountBalance)}</span></p>
        </header>
        <div class="card-body">
            {#if $accounts.length === 0}
                <p class="text-slate-500">No accounts yet.</p>
            {:else}
                <ul class="divide-y divide-gray-200">
                    {#each $accounts as a (a.id)}
                        <li class="py-3 flex items-center justify-between">
                            <a class="flex-1" href={`/accounts/${a.id}`}>
                                <div>
                                    <p class="font-medium text-slate-900 hover:underline">{a.name}</p>
                                    <p class="text-sm text-slate-500"><span class="badge-soft">{a.type}</span></p>
                                </div>
                            </a>
                            <div class="font-semibold {a.balance < 0 ? 'text-red-600' : 'text-green-700'}">{formatCurrency(a.balance)}</div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </section>

    <section class="card">
        <header class="card-header section-accent">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-700">Recent transactions</h2>
        </header>
        <div class="card-body">
            {#if $transactions.length === 0}
                <p class="text-slate-500">No transactions yet.</p>
            {:else}
                <ul class="divide-y divide-gray-200">
                    {#each [...$transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5) as t (t.id)}
                        <li class="py-3 flex items-start justify-between gap-4">
                            <div>
                                <p class="font-medium text-slate-900">{t.description}</p>
                                <p class="text-sm text-slate-500">{t.type === 'transfer' ? 'Transfer' : t.type === 'deposit' ? 'Deposit' : 'Withdrawal'} · {new Date(t.date).toLocaleDateString()}</p>
                            </div>
                            <div class="font-semibold {t.type === 'withdrawal' ? 'text-red-600' : 'text-green-700'}">{t.type === 'withdrawal' ? '-' : '+'}{formatCurrency(t.amount)}</div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </section>

    <!-- Quick Transaction -->
    <section class="card">
        <header class="card-header section-accent">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-700">Quick Transaction</h2>
        </header>
        <div class="card-body">
            <form class="grid grid-cols-1 sm:grid-cols-5 gap-3" on:submit|preventDefault={submitQuickAdd}>
                <select class="border border-gray-300 rounded px-3 py-2" bind:value={txType}>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="deposit">Deposit</option>
                    <option value="transfer">Transfer</option>
                </select>
                <select class="border border-gray-300 rounded px-3 py-2" bind:value={accountId}>
                    <option value="" disabled selected>Select account</option>
                    {#each $accounts as a (a.id)}
                        <option value={a.id}>{a.name}</option>
                    {/each}
                </select>
                {#if txType === 'transfer'}
                    <select class="border border-gray-300 rounded px-3 py-2" bind:value={toAccountId}>
                        <option value="" disabled selected>To account</option>
                        {#each $accounts.filter(a => a.id !== accountId) as a (a.id)}
                            <option value={a.id}>{a.name}</option>
                        {/each}
                    </select>
                {/if}
                <input class="border border-gray-300 rounded px-3 py-2" type="number" min="0" step="0.01" placeholder="Amount" bind:value={amountStr} />
                <button class="btn-primary" type="submit">Add</button>
            </form>
        </div>
    </section>
</div>
