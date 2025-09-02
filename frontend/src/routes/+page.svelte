<script lang="ts">
    import { accounts, totalAccountBalance, createAccount as createAccountStore } from '$lib/stores/accounts';
    import { transactions, addWithdrawal, addDeposit, addTransfer } from '$lib/stores/transactions';

    function formatCurrency(value: number): string {
        return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    }

    function goalLine(a) {
        const now=new Date();
        const end=new Date(a.goalDate);
        const ms=end.getTime()-now.getTime();
        const days=Math.max(0,ms/86400000);
        const remaining=Math.max(0,a.goalAmount-a.balance);
        let per=0;
        if(a.goalFrequency==='daily') per=remaining/Math.ceil(days||1);
        else if(a.goalFrequency==='weekly') per=remaining/Math.ceil(days/7||1);
        else per=remaining/Math.ceil(days/30||1);
        return `${per.toLocaleString(undefined,{style:'currency',currency:'USD'})}/${a.goalFrequency} to save (${a.goalAmount.toLocaleString(undefined,{style:'currency',currency:'USD'})}) by ${end.toLocaleDateString()}`;
    }

    // Recent transactions are rendered inline in the template

    // quick transaction form state
    let txType: 'deposit' | 'withdrawal' | 'transfer' = 'withdrawal';
    let amountStr = '';
    let accountId = '';
    let toAccountId = '';

    // add account form state
    let accName = '';
    let accType: 'Checking' | 'Savings' | 'Credit Card' | 'Cash' | 'Investment' | 'Other' = 'Checking';
    let accStash: 'Cash' | 'Bank' | 'Crypto Wallet' | 'Investment' = 'Bank';
    let accBalanceStr = '';
    let showModal = false;

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

    function submitAddAccount() {
        const balance = parseFloat(accBalanceStr);
        if (!accName.trim() || Number.isNaN(balance)) return;
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        createAccountStore({ id, name: accName.trim(), type: accType, balance, stashType: accStash });
        accName = '';
        accBalanceStr = '';
        accType = 'Checking';
        accStash = 'Bank';
        showModal = false;
    }
</script>

<div class="space-y-6">
    <h1 class="title-xl">Accounts</h1>

    <section class="card">
        <header class="card-header section-accent flex items-center justify-between">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-700">Your accounts</h2>
            <p class="text-sm text-slate-600">Total: <span class="font-semibold brand-text">{formatCurrency($totalAccountBalance)}</span></p>
            <button class="btn-primary text-sm" on:click={() => showModal = true}>Add Account</button>
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
                                    <p class="text-sm text-slate-500 flex items-center gap-1">
                                        <span class="badge-soft">{a.type}</span>
                                        <span class="badge-soft">{a.stashType}</span>
                                    </p>
                                    <p class="text-xs text-slate-400 mt-0.5">Last txn: {a.lastTxDate ? new Date(a.lastTxDate).toLocaleDateString() : '—'}</p>
                                    {#if a.goalAmount && a.goalDate && a.goalFrequency}
                                        <p class="text-xs text-slate-500 mt-0.5">{goalLine(a)}</p>
                                    {/if}
                                </div>
                            </a>
                            <div class="flex items-center gap-2">
                                <div class="font-semibold {a.balance < 0 ? 'text-red-600' : 'text-green-700'}">{formatCurrency(a.balance)}</div>
                            </div>
                            <button class="text-slate-400 hover:text-slate-600 ml-3" title="Delete" on:click={() => {
                                if (confirm(`Delete account '${a.name}'? All its transactions will also be removed.`)) {
                                    import('$lib/stores/accounts').then(m => m.deleteAccount(a.id));
                                }
                            }}>✕</button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </section>

    <!-- Add Account Modal -->
    {#if showModal}
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" on:click={() => showModal=false}>
            <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6" on:click|stopPropagation>
                <h3 class="text-lg font-semibold mb-4">Add Account</h3>
                <form class="space-y-3" on:submit|preventDefault={submitAddAccount}>
                    <input class="border border-gray-300 rounded px-3 py-2 w-full" type="text" placeholder="Account name" bind:value={accName} />
                    <div class="grid grid-cols-2 gap-3">
                        <select class="border border-gray-300 rounded px-3 py-2" bind:value={accType}>
                            <option value="Checking">Checking</option>
                            <option value="Savings">Savings</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Cash">Cash</option>
                            <option value="Investment">Investment</option>
                            <option value="Other">Other</option>
                        </select>
                        <select class="border border-gray-300 rounded px-3 py-2" bind:value={accStash}>
                            <option value="Bank">Bank</option>
                            <option value="Cash">Cash</option>
                            <option value="Crypto Wallet">Crypto Wallet</option>
                            <option value="Investment">Investment</option>
                        </select>
                    </div>
                    <input class="border border-gray-300 rounded px-3 py-2 w-full" type="number" min="0" step="0.01" placeholder="Starting balance" bind:value={accBalanceStr} />
                    <div class="flex gap-3 justify-end pt-2">
                        <button type="button" class="text-slate-500" on:click={() => showModal=false}>Cancel</button>
                        <button class="btn-primary" type="submit">Create</button>
                    </div>
                </form>
            </div>
        </div>
    {/if}

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

    <!-- Recent Transactions -->
    <section class="card">
        <header class="card-header section-accent">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-700">Recent transactions</h2>
        </header>
        <div class="card-body">
            {#if $transactions.length === 0}
                <p class="text-slate-500">No transactions yet.</p>
            {:else}
                <div class="max-h-96 overflow-y-auto">
                    <ul class="divide-y divide-gray-200">
                        {#each [...$transactions].sort((a, b) => b.date.localeCompare(a.date)) as t (t.id)}
                            <li class="py-3 flex items-start justify-between gap-4">
                                <div>
                                    <p class="font-medium text-slate-900">{t.description}</p>
                                    <p class="text-sm text-slate-500">{t.type === 'transfer' ? 'Transfer' : t.type === 'deposit' ? 'Deposit' : 'Withdrawal'} · {new Date(t.date).toLocaleDateString()}</p>
                                </div>
                                <div class="font-semibold {t.type === 'withdrawal' ? 'text-red-600' : 'text-green-700'}">{t.type === 'withdrawal' ? '-' : '+'}{formatCurrency(t.amount)}</div>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>
    </section>
</div>
