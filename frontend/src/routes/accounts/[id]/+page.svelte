<script lang="ts">
    import { page } from '$app/stores';
    import { accounts, setAccountGoal, deleteAccount } from '$lib/stores/accounts';
    import { transactions, addDeposit, addWithdrawal, addTransfer, deleteTransaction } from '$lib/stores/transactions';

    function formatCurrency(value: number): string {
        return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    }

    $: accountId = $page.params.id as string;
    $: account = $accounts.find((a) => a.id === accountId);

$: if (account) {
    frequency = account.goalFrequency ?? frequency;
    editingGoal = !(account.goalAmount && account.goalDate);
}

    $: accountTransactions = $transactions
        .filter((t) => t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId)
        .sort((a, b) => b.date.localeCompare(a.date));

    // quick transaction for this account only
    let txType: 'deposit' | 'withdrawal' | 'transfer' = 'withdrawal';
    let amountStr = '';
    let toAccountId = '';

    // goal state
    let goalAmountStr = '';
    let goalDateStr = '';
    let frequency: 'daily' | 'weekly' | 'monthly' = 'monthly';
    let editingGoal = true;

    // edit modal state
    let editingDetails = false;
    let editName = '';
    let editType = '';
    let editStash = '';
    let editBalanceStr = '';

    async function saveDetails() {
        if(!account) return;
        const balanceNum = parseFloat(editBalanceStr);
        if(Number.isNaN(balanceNum)) return;
        await import('$lib/stores/accounts').then(m=>m.updateAccountStore(account.id,{
            name: editName,
            type: editType,
            stashType: editStash,
            balance: balanceNum
        }));
        editingDetails=false;
    }

    function perPeriodCalc(a) {
        if(!a.goalAmount||!a.goalDate) return 0;
        const now=new Date();
        const end=new Date(a.goalDate);
        const days=Math.max(0,(end.getTime()-now.getTime())/86400000);
        const remaining=Math.max(0,a.goalAmount-a.balance);
        if(a.goalFrequency==='daily') return remaining/Math.ceil(days||1);
        if(a.goalFrequency==='weekly') return remaining/Math.ceil(days/7||1);
        return remaining/Math.ceil(days/30||1);
    }

    function catchUpLineAcc(a){
        if(!a.goalFrequency) return '';
        if(!a.lastTxDate) return 'On Track!';
        const last=new Date(a.lastTxDate);
        const now=new Date();
        let missed=0;
        if(a.goalFrequency==='daily') missed=Math.floor((now.getTime()-last.getTime())/86400000)-1;
        else if(a.goalFrequency==='weekly') missed=Math.floor((now.getTime()-last.getTime())/(86400000*7))-1;
        else missed=((now.getFullYear()-last.getFullYear())*12+(now.getMonth()-last.getMonth()))-1;
        if(missed<=0) return 'On Track!';
        const per=perPeriodCalc(a);
        const amt=per*missed;
        return `Catch-up: ${amt.toLocaleString(undefined,{style:'currency',currency:'USD'})} needed to get back on track`;
    }

    $: currentBalance = account ? account.balance : 0;
    $: goalAmount = goalAmountStr ? parseFloat(goalAmountStr) : (account?.goalAmount ?? undefined);
    $: goalDate = goalDateStr ? goalDateStr : (account?.goalDate ?? undefined);

    function saveGoal() {
        if (!account || goalAmount === undefined || !goalDate) return;
        setAccountGoal(account.id, goalAmount, goalDate, frequency);
        editingGoal = false;
    }

    // savings calculator
    $: perPeriod = computePerPeriod(currentBalance, goalAmount, goalDate, frequency);

    function computePerPeriod(current: number, target?: number, dateISO?: string, freq: 'daily'|'weekly'|'monthly' = 'monthly') {
        if (target === undefined || !dateISO) return undefined;
        const now = new Date();
        const end = new Date(dateISO);
        const ms = end.getTime() - now.getTime();
        if (ms <= 0) return undefined;
        const days = ms / (1000 * 60 * 60 * 24);
        const remaining = Math.max(0, target - current);
        if (remaining <= 0) return 0;
        if (freq === 'daily') return remaining / Math.ceil(days);
        if (freq === 'weekly') return remaining / Math.ceil(days / 7);
        return remaining / Math.ceil(days / 30);
    }

    function submitQuickTx() {
        const amount = parseFloat(amountStr);
        if (!account || Number.isNaN(amount) || amount <= 0) return;
        if (txType === 'withdrawal') {
            addWithdrawal({ accountId: account.id, amount, description: 'Withdrawal' });
        } else if (txType === 'deposit') {
            addDeposit({ accountId: account.id, amount, description: 'Deposit' });
        } else {
            if (!toAccountId || toAccountId === account.id) return;
            addTransfer({ fromAccountId: account.id, toAccountId, amount, description: 'Transfer' });
        }
        amountStr = '';
        toAccountId = '';
        txType = 'withdrawal';
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <h1 class="title-xl">{account ? account.name : 'Account'}</h1>
        {#if account}
            <button class="text-slate-400 hover:text-slate-600" on:click={() => {
                editingDetails = true;
                editName = account.name;
                editType = account.type;
                editStash = account.stashType;
                editBalanceStr = account.balance.toString();
            }}>Edit</button>
        {/if}
    </div>

    <section class="card">
        <header class="card-header section-accent flex items-center justify-between">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-700">Goal Calculator</h2>
            <div class="flex items-center gap-3">
                {#if account}
                    <p class="text-sm text-slate-600">Balance: <span class="font-semibold brand-text">{formatCurrency(account.balance)}</span></p>
                    <button class="text-slate-400 hover:text-slate-600" title="Delete account" on:click={() => deleteAccount(account.id)}>✕</button>
                {/if}
            </div>
        </header>
        <div class="card-body">
            {#if !account}
                <p class="text-slate-500">Account not found.</p>
            {:else}
                <p class="subtitle">Type: {account.type}</p>
                {#if editingGoal}
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input class="border border-gray-300 rounded px-3 py-2" type="number" min="0" step="0.01" placeholder="Goal amount" bind:value={goalAmountStr} />
                        <input class="border border-gray-300 rounded px-3 py-2" type="date" placeholder="Target date" bind:value={goalDateStr} />
                        <select class="border border-gray-300 rounded px-3 py-2" bind:value={frequency}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        <button class="btn-primary" on:click={saveGoal} type="button">Save</button>
                    </div>
                {:else}
                    <div class="mt-4 space-y-2">
                        <div class="flex items-center justify-between">
                            <p class="text-slate-700 text-sm">Need <span class="font-semibold brand-text">{formatCurrency(perPeriod ?? 0)}</span> per {account.goalFrequency} to save ({formatCurrency(account.goalAmount)}) by {new Date(account.goalDate).toLocaleDateString()}</p>
                            <button class="text-slate-400 hover:text-slate-600" on:click={() => {
                                editingGoal = true;
                                goalAmountStr = account.goalAmount?.toString() ?? '';
                                goalDateStr = account.goalDate ?? '';
                                frequency = account.goalFrequency ?? 'monthly';
                            }}>Edit</button>
                        </div>
                        {#if catchUpLineAcc(account) === 'On Track!'}
                            <p class="text-green-700 text-sm">On Track!</p>
                        {:else if catchUpLineAcc(account)}
                            <p class="text-orange-600 text-sm">{catchUpLineAcc(account)}</p>
                        {/if}
                    </div>
                {/if}
            {/if}
        </div>
    </section>

    {#if editingDetails}
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" on:click={() => editingDetails=false}>
            <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6" on:click|stopPropagation>
                <h3 class="text-lg font-semibold mb-4">Edit Account</h3>
                <form class="space-y-3" on:submit|preventDefault={saveDetails}>
                    <input class="border border-gray-300 rounded px-3 py-2 w-full" type="text" bind:value={editName} placeholder="Name" />
                    <input class="border border-gray-300 rounded px-3 py-2 w-full" type="text" bind:value={editType} placeholder="Type" />
                    <input class="border border-gray-300 rounded px-3 py-2 w-full" type="text" bind:value={editStash} placeholder="Stash Type" />
                    <input class="border border-gray-300 rounded px-3 py-2 w-full" type="number" step="0.01" bind:value={editBalanceStr} placeholder="Balance" />
                    <div class="flex gap-3 justify-end pt-2">
                        <button type="button" class="text-slate-500" on:click={() => editingDetails=false}>Cancel</button>
                        <button class="btn-primary" type="submit">Save</button>
                    </div>
                </form>
            </div>
        </div>
    {/if}

    <section class="card">
        <header class="card-header section-accent">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-700">Transactions</h2>
        </header>
        <div class="card-body">
            {#if accountTransactions.length === 0}
                <p class="text-slate-500">No transactions yet.</p>
            {:else}
                <ul class="divide-y divide-gray-200">
                    {#each accountTransactions as t (t.id)}
                        <li class="py-3 flex items-start justify-between gap-4">
                            <div>
                                <p class="font-medium text-slate-900">{t.description}</p>
                                <p class="text-sm text-slate-500">{t.type} · {new Date(t.date).toLocaleDateString()}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="font-semibold {t.type === 'withdrawal' ? 'text-red-600' : 'text-green-700'}">{t.type === 'withdrawal' ? '-' : '+'}{formatCurrency(t.amount)}</div>
                                <button class="text-slate-400 hover:text-slate-600" title="Delete" on:click={() => deleteTransaction(t.id)}>✕</button>
                            </div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </section>

    <section class="card">
        <header class="card-header section-accent">
            <h2 class="text-sm font-semibold tracking-wide uppercase text-slate-700">Quick Transaction</h2>
        </header>
        <div class="card-body">
            <form class="grid grid-cols-1 sm:grid-cols-4 gap-3" on:submit|preventDefault={submitQuickTx}>
                <select class="border border-gray-300 rounded px-3 py-2" bind:value={txType}>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="deposit">Deposit</option>
                    <option value="transfer">Transfer</option>
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


