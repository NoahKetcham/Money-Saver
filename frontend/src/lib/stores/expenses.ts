import { writable, derived } from 'svelte/store';

export type Expense = {
	id: string;
	date: string; // ISO date
	category: string;
	description: string;
	amount: number;
};

const initialExpenses: Expense[] = [
	{ id: 'e1', date: new Date().toISOString(), category: 'Food', description: 'Groceries', amount: 54.32 },
	{ id: 'e2', date: new Date().toISOString(), category: 'Transport', description: 'Gas', amount: 35.1 }
];

export const expenses = writable<Expense[]>(initialExpenses);

export const totalSpent = derived(expenses, ($expenses) =>
	$expenses.reduce((sum, e) => sum + e.amount, 0)
);

export function addExpense(expense: Omit<Expense, 'id'>) {
	expenses.update((list) => {
		const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
		return [...list, { ...expense, id }];
	});
}

export function removeExpense(id: string) {
	expenses.update((list) => list.filter((e) => e.id !== id));
}

