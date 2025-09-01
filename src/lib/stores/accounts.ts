import { derived, writable } from 'svelte/store';

export type Account = {
	id: string;
	name: string;
	type: 'Checking' | 'Savings' | 'Credit Card' | 'Cash' | 'Investment' | 'Other';
	balance: number;
	goalAmount?: number; // optional target amount
	goalDate?: string; // ISO date
};

const initialAccounts: Account[] = [
	{ id: 'a1', name: 'Everyday Checking', type: 'Checking', balance: 1240.55 },
	{ id: 'a2', name: 'High-Yield Savings', type: 'Savings', balance: 5025.0 },
	{ id: 'a3', name: 'Visa Rewards', type: 'Credit Card', balance: -235.78 }
];

export const accounts = writable<Account[]>(initialAccounts);

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

export function setAccountGoal(id: string, goalAmount?: number, goalDate?: string) {
	accounts.update((list) =>
		list.map((a) => (a.id === id ? { ...a, goalAmount, goalDate } : a))
	);
}


