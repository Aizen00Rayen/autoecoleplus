module.exports = {
    plugins: [
        require('@tailwindcss/postcss')(), // مهم باش Vite يعرف Tailwind مع PostCSS
        require('autoprefixer'),
    ],
};