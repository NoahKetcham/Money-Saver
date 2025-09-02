import { derived, writable, get } from 'svelte/store';
import { fetchAccounts, createAccount as apiCreateAccount, deleteAccount as apiDeleteAccount, updateAccount as apiUpdateAccount } from '$lib/api';
import { auth } from '$lib/stores/auth';

export type Account = {
	id: string;
	name: string;
	type: 'Checking' | 'Savings' | 'Credit Card' | 'Cash' | 'Investment' | 'Other';
	stashType: 'Cash' | 'Bank' | 'Crypto Wallet' | 'Investment';
	balance: number;
	goalAmount?: number; // optional target amount
	goalDate?: string; // ISO date
	goalFrequency?: 'daily' | 'weekly' | 'monthly';
	lastTxDate?: string;
};

export const accounts = writable<Account[]>([]);

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
				lastTxDate: a.last_tx_date
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


