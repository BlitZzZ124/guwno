/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7289da",
        "primary-hover": "#677bc4",
        secondary: "#72767d",
        discord: {
          dark: "#36393f",
          darker: "#2f3136",
          light: "#40444b",
          blurple: "#7289da",
          "blurple-hover": "#677bc4",
          green: "#43b581",
          red: "#f04747",
          yellow: "#faa61a",
          text: "#dcddde",
          muted: "#72767d",
          "hover-text": "#dcddde",
          hover: "rgba(79, 84, 92, 0.16)",
          selected: "rgba(114, 137, 218, 0.2)",
          "message-hover": "rgba(4, 4, 5, 0.07)",
          input: "#40444b",
          border: "rgba(79, 84, 92, 0.48)",
        },
      },
      spacing: {
        18: "4.5rem",
        section: "2rem",
      },
      borderRadius: {
        container: "0.5rem",
      },
      fontFamily: {
        sans: ['Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
