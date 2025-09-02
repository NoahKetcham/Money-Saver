/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				brand: {
					50: '#F9EDEE',
					100: '#F1D1D6',
					600: '#6E001F',
					700: '#530018'
				}
			}
		}
	},
	darkMode: 'class',
	plugins: []
};

