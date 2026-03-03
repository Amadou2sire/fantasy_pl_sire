export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#1152d4",
        "background-light": "#ffffff",
        "background-dark": "#14171e", // or #f8fafc as in dashboard_home.html, leaving as #14171e from conseiller_ia for true dark mode if needed
        "accent": "#1152d4",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.5rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"
      },
    },
  },
  plugins: [],
};
