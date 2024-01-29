const config = {
	content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'],

	plugins: [
		require('flowbite/plugin')
	],

	darkMode: 'class',

	theme: {
		screens: {
			'xs': {'max': '640px'},
			'sm': {'min': '640px', 'max': '767px'},
			'md': {'min': '768px', 'max': '1023px'},
			'lg': {'min': '1024px', 'max': '1279px'},
			'xl': {'min': '1280px', 'max': '1535px'},
			'2xl': {'min': '1536px'},
		},
		extend: {
			colors: {
				// flowbite-svelte
				primary: {
					50: '#FFF5F2',
					100: '#FFF1EE',
					200: '#FFE4DE',
					300: '#FFD5CC',
					400: '#FFBCAD',
					500: '#FE795D',
					600: '#EF562F',
					700: '#EB4F27',
					800: '#CC4522',
					900: '#A5371B'
				}
			}
		}
	}
};

module.exports = config;