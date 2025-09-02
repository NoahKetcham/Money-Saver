import { writable } from 'svelte/store';
import { accounts } from './accounts';
import { createTransaction as apiCreateTx, deleteTransaction as apiDeleteTx, fetchTransactions } from '$lib/api';
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';

export type Transaction = {
  id: string;
  date: string; // ISO
  type: TransactionType;
  amount: number;
  description: string;
  accountId?: string; // for deposit/withdrawal
  fromAccountId?: string; // for transfer
  toAccountId?: string; // for transfer
};

export const transactions = writable<Transaction[]>([]);

export async function loadTransactions() {
  if (!get(auth).token) return;
  try {
    const data = await fetchTransactions();
    transactions.set(
      data.map((t: any) => ({
        id: t.id,
        date: t.date || new Date().toISOString(),
        type: t.type,
        amount: t.amount,
        description: t.description,
        accountId: t.account_id,
        fromAccountId: t.from_account_id,
        toAccountId: t.to_account_id
      }))
    );
  } catch (e) {
    console.error('Failed to load transactions', e);
  }
}

function generateId(): string {
  // crypto.randomUUID is not available in all environments
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2);
}

export function addDeposit(args: { accountId: string; amount: number; description: string; date?: string }) {
  const { accountId, amount, description } = args;
  const date = args.date ?? new Date().toISOString();
  const newTx = { id: generateId(), type: 'deposit' as const, account_id: accountId, amount, description, date };
  void apiCreateTx(newTx as any).catch(console.error);
  transactions.update((list) => [...list, { id: newTx.id, type: 'deposit', accountId, amount, description, date }]);
  accounts.update((list) => list.map((a) => (a.id === accountId ? { ...a, balance: a.balance + amount } : a)));
}

export function addWithdrawal(args: { accountId: string; amount: number; description: string; date?: string }) {
  const { accountId, amount, description } = args;
  const date = args.date ?? new Date().toISOString();
  const newTx = { id: generateId(), type: 'withdrawal' as const, account_id: accountId, amount, description, date };
  void apiCreateTx(newTx as any).catch(console.error);
  transactions.update((list) => [...list, { id: newTx.id, type: 'withdrawal', accountId, amount, description, date }]);
  accounts.update((list) => list.map((a) => (a.id === accountId ? { ...a, balance: a.balance - amount } : a)));
}

export function addTransfer(args: { fromAccountId: string; toAccountId: string; amount: number; description: string; date?: string }) {
  const { fromAccountId, toAccountId, amount, description } = args;
  const date = args.date ?? new Date().toISOString();
  const newTx = { id: generateId(), type: 'transfer' as const, from_account_id: fromAccountId, to_account_id: toAccountId, amount, description, date };
  void apiCreateTx(newTx as any).catch(console.error);
  transactions.update((list) => [...list, { id: newTx.id, type: 'transfer', fromAccountId, toAccountId, amount, description, date }]);
  accounts.update((list) =>
    list.map((a) =>
      a.id === fromAccountId
        ? { ...a, balance: a.balance - amount }
        : a.id === toAccountId
        ? { ...a, balance: a.balance + amount }
        : a
    )
  );
}

function applyBalanceDeltaFor(tx: Transaction, sign: 1 | -1) {
  if (tx.type === 'deposit' && tx.accountId) {
    accounts.update((list) => list.map((a) => (a.id === tx.accountId ? { ...a, balance: a.balance + sign * tx.amount } : a)));
  } else if (tx.type === 'withdrawal' && tx.accountId) {
    accounts.update((list) => list.map((a) => (a.id === tx.accountId ? { ...a, balance: a.balance - sign * tx.amount } : a)));
  } else if (tx.type === 'transfer' && tx.fromAccountId && tx.toAccountId) {
    accounts.update((list) =>
      list.map((a) =>
        a.id === tx.fromAccountId
          ? { ...a, balance: a.balance - sign * tx.amount }
          : a.id === tx.toAccountId
          ? { ...a, balance: a.balance + sign * tx.amount }
          : a
      )
    );
  }
}

export function deleteTransaction(id: string) {
  let removed: Transaction | undefined;
  transactions.update((list) => {
    removed = list.find((t) => t.id === id);
    return list.filter((t) => t.id !== id);
  });
  void apiDeleteTx(id).catch(console.error);
  if (removed) {
    // reverse the effect of the removed transaction
    applyBalanceDeltaFor(removed, -1);
  }
}

export function updateTransaction(updated: Transaction) {
  let previous: Transaction | undefined;
  transactions.update((list) => {
    const idx = list.findIndex((t) => t.id === updated.id);
    if (idx === -1) return list;
    previous = list[idx];
    const copy = [...list];
    copy[idx] = updated;
    return copy;
  });
  if (previous) {
    // reverse previous, then apply new
    applyBalanceDeltaFor(previous, -1);
    applyBalanceDeltaFor(updated, 1);
  }
}


