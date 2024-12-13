/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Si vous utilisez le dossier `app`
    "./pages/**/*.{js,ts,jsx,tsx}", // Si vous utilisez le dossier `pages`
    "./components/**/*.{js,ts,jsx,tsx}", // Pour vos composants réutilisables
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
