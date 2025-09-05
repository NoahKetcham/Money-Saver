import { derived, writable, get } from 'svelte/store';
import { fetchAccounts, fetchClosedAccounts, createAccount as apiCreateAccount, deleteAccount as apiDeleteAccount, updateAccount as apiUpdateAccount, closeAccount as apiCloseAccount, restoreAccount as apiRestoreAccount } from '$lib/api';
import { auth } from '$lib/stores/auth';

export type Account = {
	id: string;
	name: string;
	type: string;
	stashType: string;
	balance: number;
	status: 'active' | 'closed';
	closed_reason?: string;
	goalAmount?: number; // optional target amount
	goalDate?: string; // ISO date
	goalFrequency?: 'daily' | 'weekly' | 'monthly';
	lastTxDate?: string;
};

export const accounts = writable<Account[]>([]);
export const closedAccounts = writable<Account[]>([]);

export async function loadAccounts() {
	if (!get(auth).token) return;
	try {
		const data = await fetchAccounts();
		// Map API snake_case to store camelCase for goals
		accounts.set(
			data.map((a: any) => ({
				id: a.id,
				name: a.name,
				type: a.type,
				balance: a.balance,
				stashType: a.stash_type,
				goalAmount: a.goal_amount,
				goalDate: a.goal_date,
				goalFrequency: a.goal_frequency,
				lastTxDate: a.last_tx_date,
				status: a.status
			}))
		);
	} catch (e) {
		console.error('Failed to load accounts', e);
	}
}

export async function createAccount(input: Omit<Account, 'goalAmount'|'goalDate'> & { goalAmount?: number; goalDate?: string }) {
	const payload = {
		id: input.id,
		name: input.name,
		type: input.type,
		balance: input.balance,
		stash_type: input.stashType,
		goal_amount: input.goalAmount,
		goal_date: input.goalDate
	} as any;
	const created = await apiCreateAccount(payload);
	accounts.update((list) => [
		...list,
		{ id: created.id, name: created.name, type: created.type, balance: created.balance, goalAmount: created.goal_amount, goalDate: created.goal_date, goalFrequency: created.goal_frequency, stashType: created.stash_type }
	]);
}

export async function deleteAccount(id: string) {
	await apiDeleteAccount(id);
	accounts.update((list) => list.filter((a) => a.id !== id));
}

export async function closeAccount(id: string, reason: string) {
    const updated = await apiCloseAccount(id, reason);
    // Remove from active list and add to closed
    accounts.update((list) => list.filter((a) => a.id !== id));
    closedAccounts.update((list) => [
        ...list,
        { ...updated, stashType: updated.stash_type, goalAmount: updated.goal_amount, goalDate: updated.goal_date, goalFrequency: updated.goal_frequency, lastTxDate: updated.last_tx_date, status: updated.status, closed_reason: updated.closed_reason }
    ]);
}

export async function restoreAccount(id: string) {
    const updated = await apiRestoreAccount(id);
    // remove from closed and add back to active
    closedAccounts.update(list=>list.filter(a=>a.id!==id));
    accounts.update(list=>[
        ...list,
        { ...updated, stashType: updated.stash_type, goalAmount: updated.goal_amount, goalDate: updated.goal_date, goalFrequency: updated.goal_frequency, lastTxDate: updated.last_tx_date, status: updated.status, closed_reason: updated.closed_reason }
    ]);
}

export async function updateAccountStore(id: string, changes: Partial<Account>) {
    const payload: any = { ...changes };
    // map camelCase back to snake
    if ('stashType' in payload) {
        payload.stash_type = payload.stashType;
        delete payload.stashType;
    }
    const updated = await apiUpdateAccount(id, payload);
    accounts.update((list) => list.map((a) => a.id === id ? { ...a, ...changes } : a));
}

export const totalAccountBalance = derived(accounts, ($accounts) =>
	$accounts.reduce((sum, a) => sum + a.balance, 0)
);

export function addAccount(account: Omit<Account, 'id'>) {
	accounts.update((list) => {
		const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
		return [...list, { ...account, id }];
	});
}

export function removeAccount(id: string) {
	accounts.update((list) => list.filter((a) => a.id !== id));
}

// Move account up (delta = -1) or down (delta = +1) within the list
export function moveAccount(id: string, delta: number) {
    accounts.update((list) => {
        const idx = list.findIndex((a) => a.id === id);
        if (idx === -1) return list;
        const newIdx = idx + delta;
        if (newIdx < 0 || newIdx >= list.length) return list; // out of bounds
        const newList = [...list];
        const [item] = newList.splice(idx, 1);
        newList.splice(newIdx, 0, item);
        return newList;
    });
}

export async function setAccountGoal(
    id: string,
    goalAmount: number,
    goalDate: string,
    goalFrequency: 'daily' | 'weekly' | 'monthly'
) {
    await apiUpdateAccount(id, {
        goal_amount: goalAmount,
        goal_date: goalDate,
        goal_frequency: goalFrequency
    } as any);
    accounts.update((list) =>
        list.map((a) =>
            a.id === id ? { ...a, goalAmount, goalDate, goalFrequency } : a
        )
    );
}

export async function loadClosedAccounts() {
    if (!get(auth).token) return;
    try {
        const data = await fetchClosedAccounts();
        closedAccounts.set(
            data.map((a: any) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                balance: a.balance,
                stashType: a.stash_type,
                goalAmount: a.goal_amount,
                goalDate: a.goal_date,
                goalFrequency: a.goal_frequency,
                lastTxDate: a.last_tx_date,
                status: a.status,
                closed_reason: a.closed_reason
            }))
        );
    } catch (e) {
        console.error('Failed to load closed accounts', e);
    }
}


