// tailwind.config.js
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",   // if using App Router
        "./pages/**/*.{js,ts,jsx,tsx}", // if using Pages Router
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    darkblue: "#0a2540",   // your dark background
                    lightgray: "#e5e7eb",  // text color
                },
            },
        },
    },
    plugins: [],
};