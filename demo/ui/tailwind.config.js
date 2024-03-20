/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,html,css,scss}"],
  theme: {
    extend: {
      backgroundImage: {
        hero: "url('./src/assets/museum.png')",
        lobby: "url('./src/assets/IIW-lobby-2.png')",
        demo: "url('./src/assets/IIW-photo.png')",
        locker: "url('./src/assets/locker.png')",
      },
    },
  },
  plugins: [],
};
