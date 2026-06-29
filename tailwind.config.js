/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'ui-serif', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Slate-blue accent palette
        accent: {
          50:  '#eef2f9',
          100: '#d5e0f1',
          200: '#aec2e3',
          300: '#8baed6', // primary accent (light usage)
          400: '#6b8cba',
          500: '#4f72a3', // primary accent (dark usage)
          600: '#3d5a84',
          700: '#2e4465',
          800: '#1f2f48',
          900: '#121c2e',
        },
        // Surface palette (dark-first)
        surface: {
          base:    '#0d1117', // deepest background
          raised:  '#161b22', // card / raised surface
          overlay: '#1c2330', // borders, dividers
          muted:   '#21262d', // subtle element backgrounds
        },
        // Ink palette
        ink: {
          primary:   '#e6edf3', // primary text on dark
          secondary: '#8b949e', // muted / supporting text
          tertiary:  '#484f58', // placeholder / disabled
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
          },
        },
      },
    },
  },
  plugins: [],
}
