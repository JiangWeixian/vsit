const { cssgg } = require('tailwind-cssgg')

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [require('@tailwindcss/typography'), require('daisyui'), cssgg],
  daisyui: {
    themes: ['black', 'night', 'light'],
    logs: false,
  },
}
