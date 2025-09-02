<script lang="ts">
    import { login, register, auth } from '$lib/stores/auth';
    import { goto } from '$app/navigation';

    // form state
    let isRegister = false;
    let first = '';
    let last = '';
    let email = '';
    let password = '';
    let error = '';

    async function submit() {
        error = '';
        try {
            if (isRegister) {
                await register(first, last, email, password);
            } else {
                await login(email, password);
            }
            goto('/');
        } catch (e: any) {
            error = e.message || 'Authentication failed';
        }
    }
</script>

<div class="flex items-center justify-center h-[70vh]">
    <div class="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 class="text-2xl font-semibold mb-6 text-center">{isRegister ? 'Create Account' : 'Log In'}</h1>
        {#if error}
            <p class="text-red-600 text-sm mb-4">{error}</p>
        {/if}
        <form class="space-y-4" on:submit|preventDefault={submit}>
            {#if isRegister}
                <div class="flex gap-3">
                    <input class="border border-gray-300 rounded px-3 py-2 w-1/2" type="text" placeholder="First name" bind:value={first} required />
                    <input class="border border-gray-300 rounded px-3 py-2 w-1/2" type="text" placeholder="Last name" bind:value={last} required />
                </div>
            {/if}
            <input class="border border-gray-300 rounded px-3 py-2 w-full" type="email" placeholder="Email" bind:value={email} required />
            <input class="border border-gray-300 rounded px-3 py-2 w-full" type="password" placeholder="Password" bind:value={password} required />
            <button class="btn-primary w-full" type="submit">{isRegister ? 'Register & Log In' : 'Log In'}</button>
        </form>
        <p class="text-sm text-center text-slate-600 mt-4">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <a class="link-brand cursor-pointer" on:click={() => (isRegister = !isRegister)}>{isRegister ? 'Log in' : 'Create one'}</a>
        </p>
    </div>
</div>
