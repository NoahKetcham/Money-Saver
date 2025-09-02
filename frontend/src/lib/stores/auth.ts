import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { API_BASE } from '$lib/api';

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
}

const initial: AuthState = {
    token: browser ? localStorage.getItem('token') : null,
    user: null
};

export const auth = writable<AuthState>(initial);

// Persist token changes
if (browser) {
    auth.subscribe((v) => {
        if (v.token) localStorage.setItem('token', v.token);
        else localStorage.removeItem('token');
    });
}

export async function login(email: string, password: string) {
    const form = new URLSearchParams({ username: email, password });
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    auth.update((s) => ({ ...s, token: data.access_token }));
    await fetchCurrentUser();
}

export function logout() {
    auth.set({ token: null, user: null });
}

export async function register(first: string, last: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: first, last_name: last, email, password })
    });
    if (!res.ok) throw new Error(await res.text());
    // Auto login after register
    await login(email, password);
}

export async function fetchCurrentUser() {
    let token: string | null;
    auth.update((s) => (token = s.token!, s));
    if (!token) return;
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
        const user: User = await res.json();
        auth.update((s) => ({ ...s, user }));
    } else {
        auth.set({ token: null, user: null });
    }
}
