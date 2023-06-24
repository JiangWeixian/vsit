const { cssgg } = require('tailwind-cssgg')

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  plugins: [require('@tailwindcss/typography'), require('daisyui'), cssgg],
  daisyui: {
    themes: ['night', 'light'],
    logs: false,
  },
}
