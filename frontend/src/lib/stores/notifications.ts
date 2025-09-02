import { writable } from 'svelte/store';

export interface Notification {
    id: number;
    message: string;
    type?: 'error' | 'success' | 'info';
}

function createNotifications() {
    const { subscribe, update } = writable<Notification[]>([]);
    let counter = 0;

    function add(message: string, type: Notification['type'] = 'info', ttl = 4000) {
        const id = counter++;
        update((n) => [...n, { id, message, type }]);
        setTimeout(() => {
            update((n) => n.filter((i) => i.id !== id));
        }, ttl);
    }

    return {
        subscribe,
        add
    };
}

export const notifications = createNotifications();
