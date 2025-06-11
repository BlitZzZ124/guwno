/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#36393f',
          darker: '#2f3136',
          darkest: '#202225',
          light: '#40444b',
          lighter: '#484c52',
          blurple: '#5865f2',
          'blurple-hover': '#4752c4',
          green: '#3ba55c',
          yellow: '#faa61a',
          red: '#ed4245',
          muted: '#72767d',
          'hover-text': '#dcddde',
          text: '#dcddde',
          border: '#40444b',
          input: '#40444b',
          hover: '#34373c',
          selected: '#393c43',
          'message-hover': 'rgba(4, 4, 5, 0.07)',
        }
      },
      fontFamily: {
        'gg-sans': ['gg sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      width: {
        '18': '4.5rem',
      },
      spacing: {
        '18': '4.5rem',
      }
    },
  },
  plugins: [],
}
