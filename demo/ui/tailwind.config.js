/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,html,css,scss}"],
  theme: {
    extend: {
      backgroundImage: {
        hero: "url('./src/assets/IIW-photo.png')",
        lobby: "url('./src/assets/IIW-lobby-2.png')",
        demo: "url('./src/assets/IIW-demo-2.png')",
      },
    },
  },
  plugins: [],
};
