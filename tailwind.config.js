/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink:    "#1A1614",
        coal:   "#252220",
        graph:  "#3A322C",
        cream:  "#F5EFE6",
        mut:    "#A89B8C",
        mustard:"#E8A317",
        burnt:  "#D8541C",
      },
    },
  },
  plugins: [],
};
