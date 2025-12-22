import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Default
        body: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'], // For Headings/Prices
      },
      colors: {
        brand: {
          red: '#E62429',       // Original Red
          bg: '#131314',        // Dark Matte Background
          surface: '#1E1F20',   // Dark Matte Surface
          dark: '#0f172a',      // Keep as fallback
          accent: '#F59E0B',    // Amber
          glass: 'rgba(30, 41, 59, 0.7)' // Glass effect base
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [
    typography,
  ],
}
