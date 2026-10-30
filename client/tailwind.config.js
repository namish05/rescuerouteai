/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712',
          900: '#0a0f1d',
          850: '#0f172a',
          800: '#141e33',
          700: '#1e293b',
          600: '#334155'
        },
        emergency: {
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          glow: 'rgba(239, 68, 68, 0.4)'
        },
        corridor: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          glow: 'rgba(34, 197, 94, 0.4)'
        },
        cyber: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          teal: '#14b8a6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(6, 182, 212, 0.8)' }
        }
      }
    },
  },
  plugins: [],
};
