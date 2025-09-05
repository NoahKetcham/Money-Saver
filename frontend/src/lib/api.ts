import { get } from 'svelte/store';
import { auth } from '$lib/stores/auth';
import { notifications } from '$lib/stores/notifications';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = get(auth).token;
	const headers: HeadersInit = { 'Content-Type': 'application/json', ...(options.headers || {}) };
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers
	});
	if (!res.ok) {
		const text = await res.text();
		notifications.add(text || `API Error ${res.status}`, 'error');
		throw new Error(`API ${res.status}: ${text}`);
	}
	return res.status === 204 ? (undefined as unknown as T) : await res.json();
}

// Accounts
export type Account = {
	id: string;
	name: string;
	type: string;
	balance: number;
	goal_amount?: number;
	goal_date?: string;
	goal_frequency?: 'daily' | 'weekly' | 'monthly';
	last_tx_date?: string;
};

export async function fetchAccounts(): Promise<Account[]> {
	return request<Account[]>('/accounts/');
}

export async function fetchClosedAccounts(): Promise<Account[]> {
	return request<Account[]>('/accounts/closed');
}

export async function fetchAccount(id: string): Promise<Account> {
	return request<Account>(`/accounts/${id}`);
}

export async function createAccount(acc: {
	id: string;
	name: string;
	type: string;
	balance: number;
	goal_amount?: number;
	goal_date?: string;
}): Promise<Account> {
	return request<Account>('/accounts/', { method: 'POST', body: JSON.stringify(acc) });
}

export async function updateAccount(id: string, acc: Partial<Account>): Promise<Account> {
	return request<Account>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(acc) });
}

export async function closeAccount(id: string, reason: string): Promise<Account> {
	return request<Account>(`/accounts/${id}/close`, { method: 'PATCH', body: JSON.stringify({ reason }) });
}

export async function restoreAccount(id: string): Promise<Account> {
    return request<Account>(`/accounts/${id}/restore`, { method: 'PATCH' });
}

export async function deleteAccount(id: string): Promise<void> {
	await request<void>(`/accounts/${id}`, { method: 'DELETE' });
}

// Transactions
export type Transaction = {
	id: string;
	date?: string;
	type: 'deposit' | 'withdrawal' | 'transfer';
	amount: number;
	description: string;
	account_id?: string;
	from_account_id?: string;
	to_account_id?: string;
};

export async function fetchTransactions(): Promise<Transaction[]> {
	return request<Transaction[]>('/transactions/');
}

export async function createTransaction(tx: Transaction): Promise<Transaction> {
	return request<Transaction>('/transactions/', {
		method: 'POST',
		body: JSON.stringify(tx)
	});
}

export async function deleteTransaction(id: string): Promise<void> {
	await request<void>(`/transactions/${id}`, { method: 'DELETE' });
}


